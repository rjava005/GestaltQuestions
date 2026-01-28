import json
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Dict, List, Optional, Tuple, Set
from uuid import UUID

from fastapi import Depends, HTTPException
from starlette import status

from src.core import logger
from src.data import QuestionDBDependency
from src.model.question import Question
from src.service import StorageService, StorageDependency
from src.service.file_service import FileService
from src.types import (
    FileData,
    QuestionData,
    SuccessDataResponse,
    SuccessFileResponse,
)
from src.utils import safe_dir_name, to_serializable
from src.web.dependencies import StorageType, StorageTypeDep
from src.types import STORAGE_TYPE


class QuestionManager:
    """Service that coordinates storage and database operations for questions."""

    def __init__(
        self,
        qdb: QuestionDBDependency,
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

    # Basic retrieval and checks
    async def get_question_path(
        self, qid: str | UUID, relative: bool = True
    ) -> str | Path:
        rel_path = await self.qdb.get_question_path(qid, self.STORAGE_TYPE)  # type: ignore
        if not rel_path:
            raise ValueError("Relative path is none")
        if relative:
            return rel_path
        return self.storage_manager.get_storage_path(rel_path, False)

    async def does_question_path_exist(self, qid: str | UUID) -> bool:
        path = await self.get_question_path(qid, relative=False)
        return self.storage_manager.does_storage_path_exist(path)

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
        # --- Step 0: Validate input ---
        question_data = QuestionData.model_validate(
            question_data,
        )
        logger.info(f"[QuestionManager] Creating '{question_data.title}'")

        # --- Step 1: Create DB record ---
        qcreated = await self.qdb.create_question(question_data)
        logger.debug(f"[QuestionManager] DB entry created (ID={qcreated.id})")

        # --- Step 2: Build folder name ---
        path_name = safe_dir_name(f"{qcreated.title}_{str(qcreated.id)[:8]}")

        # StorageManager creates actual folder and returns the path string or Path
        path = self.storage_manager.create_storage_path(path_name)

        # --- Step 3: Derive relative + absolute paths ---
        relative_path = self.storage_manager.get_storage_path(path, relative=True)
        absolute_path = self.storage_manager.get_storage_path(path, relative=False)

        logger.info(
            f"[QuestionManager] Paths ready — relative='{relative_path}', absolute='{absolute_path}'"
        )

        # --- Step 4: Always store relative path in the DB ---
        await self.qdb.set_question_path(
            qcreated.id,
            self.STORAGE_TYPE,
            relative_path,
        )
        self.qdb.session.commit()

        logger.info(
            f"[QuestionManager] Stored relative path '{relative_path}' in DB for question {qcreated.id}"
        )

        # --- Step 5: Save files using absolute filesystem path ---
        await self.handle_question_files(files or [], absolute_path, handle_images)

        logger.info(
            f"[QuestionManager] Files saved successfully for '{qcreated.title}'"
        )

        return qcreated

    async def upload_files_to_question(
        self,
        question_id: str | UUID,
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

        question = self.qdb.get_question(question_id)
        if not question:
            logger.warning("Upload failed — question %s not found", question_id)
            raise HTTPException(
                status_code=404, detail=f"Question {question_id} not found"
            )

        # Resolve question directory (relative DB path)
        relative_path = await self.qdb.get_question_path(question_id, self.STORAGE_TYPE)  # type: ignore
        if not relative_path:
            raise ValueError("Failed to get question path")
        abs_path = self.storage_manager.get_storage_path(relative_path, relative=False)

        logger.debug(
            "Resolved storage paths for question_id=%s: relative='%s', absolute='%s'",
            question_id,
            relative_path,
            abs_path,
        )

        return await self.handle_question_files(files, abs_path, auto_handle_images)

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

        # Save helper
        def save_batch(target_dir: Path, batch: List[FileData]):
            saved_paths = []
            for f in batch:
                try:
                    saved = self.storage_manager.save_file(
                        target=target_dir, filename=f.filename, content=f.content
                    )
                    saved_paths.append(saved)
                    logger.debug("Saved file '%s' -> '%s'", f.filename, saved)
                except Exception as exc:
                    logger.error(
                        "Failed saving file '%s' into '%s': %s",
                        f.filename,
                        target_dir,
                        exc,
                    )
                    raise HTTPException(
                        status_code=500,
                        detail=f"Failed saving file '{f.filename}'",
                    ) from exc
            return saved_paths

        if auto_handle_images:
            uploaded_client = save_batch(client_files_dir, client_files)
            uploaded_other = save_batch(storage_path, other_files)

            logger.info("Uploaded %d files (auto client split enabled)", len(files))
            return {
                "status": "ok",
                "detail": f"Uploaded {len(files)} files",
                "client_files": uploaded_client,
                "other_files": uploaded_other,
            }

        # No auto-split mode
        uploaded_all = save_batch(storage_path, files)
        logger.info("Uploaded %d files (no client split)", len(files))
        return {
            "status": "ok",
            "detail": f"Uploaded {len(files)} files",
            "files": uploaded_all,
        }

    async def get_question_file_names(self, question_id: str | UUID):
        """
        Return a list of stored filenames for a question.
        """
        logger.debug("Fetching file list for question_id=%s", question_id)

        logger.info("This is the storage settings %s", self.STORAGE_TYPE)
        question_path = await self.qdb.get_question_path(question_id, self.STORAGE_TYPE)  # type: ignore

        files = self.storage_manager.list_file_names(question_path)

        logger.debug("Found %d files for question_id=%s", len(files), question_id)
        return SuccessFileResponse(
            status=200, detail="Retrieved files ok", filenames=files
        )

    async def get_question_filepaths(
        self, question_id: str | UUID
    ) -> SuccessFileResponse:
        logger.debug("Fetching filepath list for question_id=%s", question_id)
        question_path = await self.qdb.get_question_path(question_id, self.STORAGE_TYPE)  # type: ignore
        filepaths = self.storage_manager.list_file_paths(question_path)
        logger.debug("Found %d files for question_id=%s", len(filepaths), question_id)
        return SuccessFileResponse(
            status=200, detail="Retrieved files ok", filenames=filepaths
        )

    async def get_question_file(self, question_id: str | UUID, filename: str):
        """
        Resolve the exact path/identifier for a stored file.
        """
        logger.debug("Resolving file '%s' for question_id=%s", filename, question_id)

        question_path = await self.qdb.get_question_path(question_id, self.STORAGE_TYPE)  # type: ignore

        # Direct images to client folder
        if await FileService().is_image(filename):
            filepath = Path(question_path) / self.client_path / filename
        else:
            filepath = Path(question_path) / filename

        return self.storage_manager.get_file_path(filepath)

    async def delete_file(self, qid: str | UUID, filename: str):
        """
        Delete a given file from storage.
        """
        logger.debug("Deleting file '%s' for question_id=%s", filename, qid)

        file = await self.get_question_file(qid, filename)
        self.storage_manager.delete_file(file)

        logger.info("Deleted file '%s' for question_id=%s", filename, qid)
        return SuccessDataResponse(status=200, detail="Deleted file ok")

    async def delete_question(self, qid: str | UUID) -> Dict[str, str]:
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

    async def read_file(self, qid: str | UUID, filename: str):
        """
        Read a file and return its text contents.
        """
        logger.debug("Reading file '%s' for question_id=%s", filename, qid)

        file = await self.get_question_file(qid, filename)
        raw_data = self.storage_manager.read_file(file)

        if raw_data is None:
            logger.warning(
                "Read attempted but file '%s' was not found (qid=%s)",
                filename,
                qid,
            )
            return SuccessDataResponse(
                status=404,
                detail=f"File '{filename}' not found",
                data=None,
            )

        text = raw_data.decode("utf-8")
        return SuccessDataResponse(
            status=status.HTTP_200_OK,
            detail=f"Read file {filename} success",
            data=text,
        )

    async def update_file(self, qid: str | UUID, filename: str, content: str | dict):
        """
        Overwrite an existing file for a question.
        """
        logger.debug("Updating file '%s' for question_id=%s", filename, qid)

        if isinstance(content, dict):
            content = json.dumps(content, indent=2)

        file = await self.get_question_file(qid, filename)

        try:
            path = self.storage_manager.save_file(
                target=file, content=content, overwrite=True
            )
        except Exception as exc:
            logger.error(
                "Failed to update file '%s' for question_id=%s: %s",
                filename,
                qid,
                exc,
            )
            raise HTTPException(
                status_code=500,
                detail=f"Failed writing file '{filename}'",
            ) from exc

        logger.info("Successfully updated file '%s' for question_id=%s", filename, qid)
        return SuccessDataResponse(
            status=200,
            detail=f"Wrote file successfully to {path}",
            data=content,
        )

    async def get_question_file_data(self, qid: str | UUID):
        pass

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

    async def list_all_question_files(self, qid: str | UUID) -> List[str]:
        """Returns all the file names for a given question

        Args:
            qid (str | UUID): _description_

        Raises:
            HTTPException: _description_

        Returns:
            List[str]: _description_
        """
        try:
            question_dir = await self.get_question_path(qid, relative=False)
            return self.storage_manager.list_file_names(question_dir)
        except Exception as e:
            logger.exception("Error resolving question storage path")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error accessing question storage path",
            ) from e


@lru_cache
def get_question_manager(
    qdb: QuestionDBDependency,
    storage: StorageDependency,
    STORAGE_TYPE: StorageTypeDep,
):
    return QuestionManager(qdb, storage, STORAGE_TYPE)


QuestionManagerDependency = Annotated[QuestionManager, Depends(get_question_manager)]
