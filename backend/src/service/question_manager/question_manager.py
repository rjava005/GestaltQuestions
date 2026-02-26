import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Set
import asyncio
from fastapi import HTTPException
from starlette import status
import base64

import mimetypes
from src.core import logger
from src.data import QuestionDB
from src.model.question import Question
from src.service import StorageService
from src.service.file_service import FileService
from src.types import (
    FileData,
    QuestionData,
)
from src.utils import safe_dir_name, to_serializable
from src.types import STORAGE_TYPE, ID


class QuestionManager:
    """Service that coordinates storage and database operations for questions."""

    def __init__(
        self,
        qdb: QuestionDB,
        storage_manager: StorageService,
        STORAGE_TYPE: STORAGE_TYPE,
        image_location="clientFiles",
        client_file_extensions: Set[str] = {
            ".png",
            ".jpg",
            ".jpeg",
            ".pdf",
        },
    ):
        """_summary_

        Args:
            qdb (QuestionManager): Manages database interactions for creating and committing the question.
            storage_manager (StorageService):  Handles file system or cloud storage initialization for the question.
            STORAGE_TYPE (StorageType): Wether we are working with the cloud or local storage
        """
        self.qdb = qdb
        self.storage_manager = storage_manager
        self.STORAGE_TYPE = STORAGE_TYPE
        self.client_path = image_location
        self.client_ext = client_file_extensions

    # Question Path setters and getters
    async def get_question_path(
        self,
        qid: ID,
        relative: bool = True,
    ) -> str | Path | None:
        rel_path = await self.qdb.get_question_path(qid, self.STORAGE_TYPE)

        if rel_path is None:
            return None

        if relative:
            return rel_path

        return self.storage_manager.get_storage_path(rel_path, False)

    async def set_question_path(
        self, qid: ID, path: str | Path | None = None, override: bool = False
    ) -> Tuple[str | Path, str | Path]:

        q = await self.qdb.get_question(qid)
        if q is None:
            raise ValueError("Failed to retrieve question. Question is None")

        # Check if the question path exist
        exists = await self.does_question_path_exist(q.id)
        if exists and not override:
            raise ValueError("Question path already exists and override is disabled")
        if path is None and qid is None:
            raise ValueError("Cannot determine the location to save the question to")
        if path is None:
            qpath: str | Path = safe_dir_name(f"{q.title}_{str(q.id)[:8]}")
        else:
            qpath = path

        qpath = self.storage_manager.create_storage_path(qpath)
        # Derive relative + absolute paths
        relative_path = self.storage_manager.get_storage_path(qpath, relative=True)
        absolute_path = self.storage_manager.get_storage_path(qpath, relative=False)
        logger.info(
            f"[QuestionManager] Paths ready — relative='{relative_path}', absolute='{absolute_path}'"
        )
        # --- Always store relative path in the DB ---
        await self.qdb.set_question_path(
            q.id,
            self.STORAGE_TYPE,
            relative_path,
        )
        # May be redundant but ensure that the database changes take affect
        self.qdb.session.commit()
        return relative_path, absolute_path

    async def does_question_path_exist(self, qid: ID) -> bool:
        path = await self.get_question_path(qid, relative=False)
        if path:
            return self.storage_manager.does_storage_path_exist(path)
        return False

    # Question lifecycle

    ## Question Creation
    async def create_question(
        self,
        question_data: QuestionData | dict,
        files: Optional[List[FileData]] = None,
        handle_images: bool = True,
    ) -> Question:
        """Create a question and optionally save associated files.

            This function performs three main operations:
            1. Creates a new `Question` entry in the database via the `QuestionManagerDependency`.
            2. Generates a sanitized directory name for the question based on its title and ID.
            3. Initializes the appropriate storage path (local or cloud) and updates the database record
            with the correct relative path reference.
        args:
        question (QuestionData): Input data model containing details of the question to be created.
        Returns:
            Question: The created `Question` SQLModel instance with updated storage path information.
        Raises:
            Exception: Propagates any error encountered during creation or storage initialization.
        """
        question_data = QuestionData.model_validate(
            question_data,
        )
        logger.info(f"[QuestionManager] Creating '{question_data.title}'")
        # Add to database
        qcreated = await self.qdb.create_question(question_data)
        logger.debug(f"[QuestionManager] DB entry created (ID={qcreated.id})")
        # Set question storage path
        _, abs_path = await self.set_question_path(qcreated.id)
        # Handle any files
        await self.handle_question_files(files or [], abs_path, handle_images)
        logger.info(
            f"[QuestionManager] Files saved successfully for '{qcreated.title}'"
        )
        return qcreated

    async def update_question(
        self, qid: ID, update: QuestionData | dict, update_storage: bool = False
    ):
        q = await self.qdb.get_question(qid)
        update = QuestionData.model_validate(update)
        if not q:
            logger.warning(f"Question with ID {qid} not found — cannot update.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Question {id} not found.",
            )
        if update_storage and update.title:
            await self.handle_storage_update(qid)
        return await self.qdb.update_question(qid, update=update)

    async def handle_storage_update(
        self,
        qid: ID,
    ) -> None:
        old = await self.get_question_path(qid, relative=False)
        if not old:
            logger.error(f"No valid storage path found for question ID {qid}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Storage path missing for question {qid}.",
            )
        rel, abs_new = await self.set_question_path(qid, override=True)
        logger.debug(f"Renamed storage path for question {id}: {old} → {abs_new}")
        self.storage_manager.copy_storage(old, abs_new)
        self.storage_manager.delete_storage(old)
        return None

    async def delete_question(self, qid: ID) -> Dict[str, str]:
        # Check if question is in database
        question = await self.qdb.get_question(qid)
        if not question:
            raise HTTPException(status_code=404, detail="Question {qid} not found")
        question_path = await self.qdb.get_question_path(qid, self.STORAGE_TYPE)  # type: ignore
        if not question_path:
            raise ValueError("Failed to get question path")
        storage = self.storage_manager.get_storage_path(question_path, relative=False)

        # First delete from database
        await self.qdb.delete_question(qid)
        self.storage_manager.delete_storage(storage)
        return {"status": "ok", "detail": "Deleted Question"}

    # Handle any uploads to files
    async def handle_question_files(
        self,
        files: List[FileData],
        storage_path: str | Path,
        auto_handle_images: bool = True,
    ) -> Dict:
        """
        Save a set of uploaded files.

        Splits into client files (images/docs) and main files when auto-handling is enabled.
        """
        storage_path = Path(storage_path)
        client_files_dir = storage_path / self.client_path

        logger.debug(
            "Handling upload of %d files into storage_path='%s'",
            len(files),
            storage_path,
        )

        client_files: List[FileData] = []
        other_files: List[FileData] = []

        # Categorize files
        for f in files:
            if not f.filename:
                logger.warning("Skipped file with missing filename")
                raise HTTPException(
                    status_code=status.HTTP_406_NOT_ACCEPTABLE,
                    detail="File must have a filename",
                )

            ext = Path(f.filename).suffix.lower()
            if ext in self.client_ext:
                client_files.append(f)
            else:
                other_files.append(f)

        if auto_handle_images:
            uploaded_client = await self.save_batch_files(
                client_files_dir, client_files
            )
            uploaded_other = await self.save_batch_files(storage_path, other_files)

            logger.info("Uploaded %d files (auto client split enabled)", len(files))
            return {
                "status": "ok",
                "detail": f"Uploaded {len(files)} files",
                "client_files": uploaded_client,
                "other_files": uploaded_other,
            }

        # No auto-split mode
        uploaded_all = await self.save_batch_files(storage_path, files)
        logger.info("Uploaded %d files (no client split)", len(files))
        return {
            "status": "ok",
            "detail": f"Uploaded {len(files)} files",
            "files": uploaded_all,
        }

    async def upload_files_to_question(
        self,
        question_id: ID,
        files: List[FileData],
        auto_handle_images: bool = True,
    ) -> Dict:
        """
        Upload a batch of files to a question.

        Performs:
        - Question existence check
        - Resolves absolute storage path (local/cloud)
        - Delegates saving to `handle_question_files()`
        """
        logger.debug("Starting upload for question_id=%s", question_id)

        question = await self.qdb.get_question(question_id)
        if not question:
            logger.warning("Upload failed — question %s not found", question_id)
            raise HTTPException(
                status_code=404, detail=f"Question {question_id} not found"
            )
        abs_path = await self.get_question_path(question.id, relative=False)
        if abs_path is None:
            raise ValueError("Cannot determine path to save questions")
        return await self.handle_question_files(files, abs_path, auto_handle_images)

    # Getting files
    async def get_question_file_names(self, qid: ID) -> List[str]:
        """
        Return a list of stored filenames for a question.
        """
        question_path = await self.get_question_path(qid, relative=False)
        if question_path is None:
            raise ValueError("Could not get question path. Question path is None")
        files = self.storage_manager.list_file_names(question_path)
        image_path = Path(question_path) / self.client_path
        files.extend(self.storage_manager.list_file_names(image_path))
        return files

    async def get_question_filepaths(self, qid: ID) -> List[str]:
        logger.debug("Fetching filepath list for question_id=%s", qid)
        question_path = await self.get_question_path(qid, relative=False)
        if question_path is None:
            raise ValueError("Could not get question path. Question path is None")

        filepaths = self.storage_manager.list_file_paths(question_path)
        logger.debug("Found %d files for question_id=%s", len(filepaths), qid)
        return filepaths

    async def get_question_filedata(self, qid: ID) -> List[FileData]:
        try:
            filenames = await self.get_question_file_names(qid)
            data = []

            for f in filenames:
                mime_type, _ = mimetypes.guess_type(f)
                if mime_type and (
                    mime_type.startswith("text")
                    or mime_type.startswith("application/json")
                ):
                    content = await self.read_file(qid, f)
                else:
                    logger.info("Got a binary file")
                    file = await self.get_question_file(qid, f)
                    raw_data = self.storage_manager.read_file(file)
                    if raw_data is None:
                        raise ValueError(f"Could not read file data for '{f}'")
                    content = base64.b64encode(raw_data).decode("utf-8")
                data.append(
                    FileData(
                        filename=f,
                        content=content,
                        mime_type=mime_type or "application/octet-stream",
                    )
                )
            return data
        except Exception as e:
            raise ValueError(f"Failed to get filedata for question  {e}")

    async def get_question_file(self, qid: ID, filename: str):
        """
        Resolve the exact path/identifier for a stored file.
        """
        logger.debug("Resolving file '%s' for question_id=%s", filename, qid)
        question_path = await self.get_question_path(qid, relative=False)
        if question_path is None:
            raise ValueError("Could not get question path. Question path is None")

        # Direct images to client folder
        if await FileService().is_image(filename):
            filepath = Path(question_path) / self.client_path / filename
        else:
            filepath = Path(question_path) / filename
        return self.storage_manager.get_file_path(filepath)

    # Reading and writting and deleting files
    async def read_file(self, qid: ID, filename: str) -> str | None:
        """
        Read a file and return its text contents.
        """
        logger.debug("Reading file '%s' for question_id=%s", filename, qid)
        file = await self.get_question_file(qid, filename)
        raw_data = self.storage_manager.read_file(file)
        if raw_data:
            return raw_data.decode("utf-8")

    async def update_file(self, qid: ID, filename: str, content: str | dict) -> bool:
        """
        Overwrite an existing file for a question.
        """
        logger.debug("Updating file '%s' for question_id=%s", filename, qid)

        if isinstance(content, dict):
            content = json.dumps(content, indent=2)
        path = await self.get_question_path(qid)
        if path is None:
            raise ValueError("Could not update file,Question path is none")
        self.storage_manager.save_file(
            target=path, filename=filename, content=content, overwrite=True
        )
        return True

    async def delete_file(self, qid: ID, filename: str) -> bool:
        """
        Delete a given file from storage.
        """
        logger.debug("Deleting file '%s' for question_id=%s", filename, qid)
        file = await self.get_question_file(qid, filename)
        self.storage_manager.delete_file(file)
        logger.info("Deleted file '%s' for question_id=%s", filename, qid)
        return True

    # helpers
    async def save_batch_files(
        self, target_dir: str | Path, files: List[FileData]
    ) -> List[str | Path]:
        return [
            self.storage_manager.save_file(
                target=target_dir, filename=f.filename, content=f.content
            )
            for f in files
        ]
