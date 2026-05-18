from typing import Any, List, Optional, Sequence, Literal, overload

from src.app_types.general import ID
from src.core.logging import logger
from src.data.question import QuestionDB
from src.model.files import FileData
from src.model.question import Question, QuestionCreate, QuestionRead, QuestionUpdate
from src.service.file_service.utils import safe_dir_name
from src.service.storage.base import Storage

from .exceptions import *
from .question_storage_service import QuestionStorageService


class QuestionManager:
    """Coordinate question database records with their backing storage files."""

    def __init__(self, storage: Storage, qdb: QuestionDB):
        """Create a manager backed by a storage implementation and question DB."""
        self.qdb = qdb
        self.storage = QuestionStorageService(storage)
        logger.debug("QuestionManager initialized with %s", storage.__class__.__name__)

    async def create_question(
        self,
        qdata: QuestionCreate,
        storage_base_path: str,
        files: Optional[List[FileData]] = None,
    ) -> Question:
        """Create a question record and optionally save its initial files.

        If file storage fails after the database record is created, the manager
        rolls back the newly created question and any files saved in this call.
        """
        question: Question | None = None
        saved_files: list[str] = []

        try:
            logger.debug(
                "Creating question title=%s file_count=%s",
                qdata.title,
                len(files or []),
            )
            # Create the base question
            qdata = self._validate_question_data(qdata)
            question = await self.qdb.create_question(qdata)

            question_slug = safe_dir_name(
                question.title or "Untitled Question", max_length=80
            )
            storage_path = (
                f"{storage_base_path.rstrip('/')}/questions/"
                f"{question_slug}_{str(question.id)[:8]}/"
            )
            question = await self.qdb.set_question_path(question.id, path=storage_path)

            if not question.storage_path:
                raise StoragePathNotFoundError(str(question.id))
            if files:
                saved_files = self._save_files(
                    question.storage_path, files, question.id
                )
            logger.info("Created question %s", question.id)
            return question
        except QuestionManagerException:
            if question is not None:
                logger.warning(
                    "Rolling back question %s after create failure", question.id
                )
                await self._rollback_created_question(question, saved_files)
            raise
        except Exception as e:
            if question is not None:
                logger.warning(
                    "Rolling back question %s after unexpected create failure",
                    question.id,
                )
                await self._rollback_created_question(question, saved_files)
            raise QuestionCreationError("database or storage error", str(e))

    @overload
    async def get_question(
        self,
        qid: ID,
        method: Literal["default"] = "default",
    ) -> Question: ...

    @overload
    async def get_question(
        self,
        qid: ID,
        method: Literal["full"],
    ) -> QuestionRead: ...
    
    async def get_question(
        self, qid: ID, method: Literal["default", "full"] = "default"
    ) -> Question | QuestionRead:
        if method == "default":
            q = await self.qdb.get_question(qid)
        elif method == "full":
            q = await self.qdb.get_question_data(qid)
        else:
            raise ValueError("Method {method} is not allowed for method get_question")
        if not q:
            raise QuestionNotFoundError(str(qid))
        return q

    async def copy_question(self, qid: ID, storage_base_path: str) -> Question:
        try:
            question = await self.qdb.get_question_data(qid)
            qdata = QuestionCreate(
                topics=question.topics,
                qTypes=question.qTypes,
                title=f"{question.title}_copy",
                ai_generated=question.ai_generated,
                isAdaptive=question.isAdaptive,
            )
            qfiles = await self.get_question_filedata(qid)
            q = await self.create_question(
                qdata, storage_base_path=storage_base_path, files=qfiles
            )
            return q
        except QuestionManagerException:
            raise
        except Exception as e:
            raise QuestionCopyFailure(reason="Failed to copy question ", details=str(e))

    async def update_question_meta(
        self, id: ID, update: QuestionUpdate
    ) -> QuestionRead:
        """Update database-backed question metadata and relationship fields."""
        try:
            logger.debug("Updating question metadata for %s", id)
            return await self.qdb.update_question(id, update)
        except QuestionManagerException:
            raise
        except Exception as e:
            raise QuestionUpdateError(question_id=str(id), reason=str(e))

    async def delete_question(self, qid: ID) -> bool:
        """Delete a question record and its storage directory.

        Storage files are snapshotted first so they can be restored if the
        storage delete succeeds but the database delete fails.
        """
        storage_path = ""
        storage_snapshot: list[tuple[str, bytes]] = []

        try:
            logger.debug("Deleting question %s", qid)
            storage_path = await self.get_storage_path(qid)
            storage_snapshot = self._snapshot_storage_dir(storage_path)
            self.storage.delete_dir(storage_path)
            logger.info(f"Deleted dir {storage_path}")
            await self.qdb.delete_question(qid)
            logger.info("Deleted question %s", qid)
            return True
        except QuestionManagerException:
            raise
        except Exception as e:
            if storage_path and storage_snapshot:
                logger.warning(
                    "Restoring storage files for question %s after delete failure",
                    qid,
                )
                self._restore_storage_files(storage_path, storage_snapshot)
            raise QuestionDeletionError(
                question_id=str(qid),
                reason="database or storage error",
                details=str(e),
            )

    async def get_question_files(self, qid: ID) -> Sequence[str]:
        """Return storage paths for files attached to a question."""
        try:
            storage_path = await self.get_storage_path(qid)
            return self.storage.list_files(storage_path)
        except QuestionManagerException:
            raise
        except Exception as e:
            raise FileListError(str(qid), str(e))

    async def read_file(self, qid: ID, filename: str) -> bytes | None:
        """Read one file from a question's storage directory."""
        try:
            storage_path = await self.get_storage_path(qid)
            return self.storage.read_file(storage_path, filename=filename)
        except QuestionManagerException:
            raise
        except Exception as e:
            raise FileOperationError("read", filename, str(e))

    async def write_file(self, qid: ID, filename: str, data: Any):
        """Write or replace one file in a question's storage directory."""
        try:
            storage_path = await self.get_storage_path(qid)
            return self.storage.write_file(storage_path, data, filename=filename)
        except QuestionManagerException:
            raise
        except Exception as e:
            raise FileOperationError("write", filename, str(e))

    async def delete_file(self, qid: ID, filename: str):
        """Delete one file from a question's storage directory."""
        try:
            storage_path = await self.get_storage_path(qid)
            return self.storage.delete_file(storage_path, filename=filename)
        except QuestionManagerException:
            raise
        except Exception as e:
            raise FileOperationError("delete", filename, str(e))

    async def get_question_filedata(self, qid: ID) -> List[FileData]:
        """Return every question file as FileData objects."""
        try:
            storage_path = await self.get_storage_path(qid)
            return self.storage.get_all_filedata(storage_path)
        except QuestionManagerException:
            raise
        except Exception as e:
            raise FileOperationError("read", str(qid), str(e))

    async def upload_files(self, qid: ID, files: List[FileData]):
        """Save additional files to an existing question.

        If one file fails after earlier files were saved, the files saved during
        this call are removed before the error is raised.
        """
        saved_files: list[str] = []
        try:
            storage_path = await self.get_storage_path(qid)
            saved_files = self._save_files(storage_path, files, qid)
            return saved_files
        except QuestionManagerException:
            self._rollback_saved_files(saved_files)
            raise
        except Exception as e:
            self._rollback_saved_files(saved_files)
            raise FileOperationError("upload", str(qid), str(e))

    async def get_storage_path(self, qid: ID) -> str:
        """Resolve the persisted storage path for a question."""
        question = await self.qdb.get_question(qid)
        if not question:
            logger.warning("Question %s was not found", qid)
            raise QuestionNotFoundError(str(qid))
        if not question.storage_path:
            logger.warning("Question %s has no storage path", qid)
            raise QuestionDeletionError(
                question_id=str(qid),
                reason="Cannot determine storage path for question cannot delete",
            )
        return question.storage_path

    def _validate_question_data(self, question_data: QuestionCreate) -> QuestionCreate:
        """Validate the required fields needed to create a question."""
        try:
            if not question_data.title:
                raise MissingQuestionDataError("title")
            return question_data
        except QuestionManagerException:
            raise
        except Exception as e:
            raise InvalidQuestionDataError("question_data", str(e))

    def _save_files(
        self, storage_path: str, files: List[FileData], question_id: ID
    ) -> list[str]:
        """Save files one at a time and roll back partial saves on failure."""
        saved_files: list[str] = []
        for file in files:
            try:
                saved_path = self.storage.write_file(
                    storage_path,
                    data=file.content,
                    filename=file.filename,
                )
                saved_files.append(saved_path)
                logger.debug(
                    "Saved file %s for question %s", file.filename, question_id
                )
            except Exception as e:
                logger.warning(
                    "Failed to save file %s for question %s",
                    file.filename,
                    question_id,
                )
                self._rollback_saved_files(saved_files)
                raise FileSaveError(file.filename, str(question_id), str(e))
        return saved_files

    async def _rollback_created_question(
        self, question: Question, saved_files: list[str]
    ) -> None:
        """Best-effort cleanup for a question created during a failed operation."""
        self._rollback_saved_files(saved_files)
        if not question.id:
            return
        try:
            await self.qdb.delete_question(question.id)
        except Exception:
            logger.exception(
                "Failed to roll back created question %s after create failure",
                question.id,
            )

    def _rollback_saved_files(self, saved_files: list[str]) -> None:
        """Best-effort delete for files saved during a failed operation."""
        for saved_file in reversed(saved_files):
            try:
                self.storage.delete_file(saved_file)
            except Exception:
                logger.exception("Failed to roll back saved file %s", saved_file)

    def _snapshot_storage_dir(self, storage_path: str) -> list[tuple[str, bytes]]:
        """Read all files under a storage directory for later restoration."""
        snapshot: list[tuple[str, bytes]] = []
        for file_path in self.storage.list_files(storage_path, recursive=True):
            content = self.storage.read_file(file_path)
            if content is not None:
                snapshot.append((file_path, content))
        return snapshot

    def _restore_storage_files(
        self, storage_path: str, snapshot: list[tuple[str, bytes]]
    ) -> None:
        """Best-effort restore of files captured by a storage snapshot."""
        for file_path, content in snapshot:
            try:
                self.storage.write_file(file_path, content)
            except Exception:
                logger.exception(
                    "Failed to restore storage file %s after delete rollback",
                    file_path,
                )
