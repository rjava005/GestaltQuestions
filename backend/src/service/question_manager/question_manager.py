import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Set

from fastapi import HTTPException
from starlette import status

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
        self,
        qid: ID,
        question_data: QuestionData | dict,
    ):
        return await self.qdb.update_question(qid, update=question_data)

    async def delete_question(self, qid: ID) -> Dict[str, str]:
        try:
            # Check if question is in database
            question = self.qdb.get_question(qid)
            if not question:
                raise HTTPException(status_code=404, detail="Question {qid} not found")

            question_path = await self.qdb.get_question_path(qid, self.STORAGE_TYPE)  # type: ignore
            if not question_path:
                raise ValueError("Failed to get question path")
            storage = self.storage_manager.get_storage_path(
                question_path, relative=False
            )

            # First delete from database
            await self.qdb.delete_question(qid)
            self.storage_manager.delete_storage(storage)
            return {"status": "ok", "detail": "Deleted Question"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to delete question {e}"
            )

    async def sync_question(
        self,
        question_data: QuestionData | dict,
        old_path: str | Path,
    ) -> Tuple[Question, str | Path]:
        """
        Create a new question record, rename its storage directory to a clean
        standardized name, update the database with the new path, and write metadata.

        Workflow:
        - Create the question in the DB
        - Construct a new folder name based on {title}_{short-id}
        - Rename the existing storage directory to avoid collisions
        - Update the question's DB entry with the new relative path
        - Serialize and save metadata (info2.json) inside the renamed directory
        """

        try:
            # 1. Create the question DB entry
            created_question = await self.qdb.create_question(question_data)

            # Resolve the original absolute path from whatever format is passed in
            abs_original_path = Path(
                self.storage_manager.get_storage_path(old_path, relative=False)
            )

            # 2. Generate a new clean directory name (title + first 8 chars of UUID)
            new_dir_name = safe_dir_name(
                f"{created_question.title}_{str(created_question.id)[:8]}"
            )

            # Construct the new absolute path using the same parent directory
            abs_renamed_path = abs_original_path.parent / new_dir_name

            # 3. Perform the actual rename using the storage manager
            renamed_path = self.storage_manager.rename_storage(
                abs_original_path, abs_renamed_path
            )
            logger.info("📁 Renamed directory to %s", renamed_path)

            # 4. Resolve both relative + absolute paths for DB storage
            relative_storage_path = self.storage_manager.get_storage_path(
                abs_renamed_path, relative=True
            )
            absolute_storage_path = self.storage_manager.get_storage_path(
                abs_renamed_path, relative=False
            )

            logger.info(
                "📄 Updated storage paths — old: %s | new relative: %s",
                old_path,
                relative_storage_path,
            )

            # Save the updated path into the question's DB record
            self.qdb.set_question_path(
                created_question.id, relative_storage_path, self.STORAGE_TYPE  # type: ignore
            )

            # 5. Load full question metadata from DB to write to disk
            question_metadata = await self.qdb.get_question_data(created_question.id)

            # Write it to info2.json inside the renamed folder
            metadata_path = (Path(absolute_storage_path) / "info2.json").resolve()
            serialized_metadata = json.dumps(
                to_serializable(question_metadata.model_dump()),
                indent=2,
                ensure_ascii=False,
            )
            self.storage_manager.save_file(metadata_path, serialized_metadata)

            return created_question, absolute_storage_path

        except Exception as e:
            # Preserve full traceback for debugging upstream
            raise e

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
        logger.debug("Fetching file list for question_id=%s", qid)
        logger.info("This is the storage settings %s", self.STORAGE_TYPE)
        question_path = await self.get_question_path(qid, relative=False)
        if question_path is None:
            raise ValueError("Could not get question path. Question path is None")
        files = self.storage_manager.list_file_names(question_path)
        logger.debug("Found %d files for question_id=%s", len(files), qid)
        return files

    async def get_question_filepaths(self, qid: ID) -> List[str]:
        logger.debug("Fetching filepath list for question_id=%s", qid)
        question_path = await self.get_question_path(qid, relative=False)
        if question_path is None:
            raise ValueError("Could not get question path. Question path is None")

        filepaths = self.storage_manager.list_file_paths(question_path)
        logger.debug("Found %d files for question_id=%s", len(filepaths), qid)
        return filepaths

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
