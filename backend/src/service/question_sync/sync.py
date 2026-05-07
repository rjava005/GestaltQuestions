# --- Standard Library ---
import asyncio
import json
from collections import defaultdict
from pathlib import Path, PurePosixPath
from typing import Literal, Sequence, Tuple, Optional, List

from pydantic import ValidationError


from src.core import logger
from src.core.logging import logger
from src.data.question import QuestionDB, QuestionData
from src.model.question import Question
from src.service.question_sync.models import (
    SyncMetrics,
    SyncSetup,
    DEFAULT_SYNC_FLAGS,
    UnsyncedQuestion,
    FolderCheckMetrics,
    QuestionSyncMinimal,
    SyncResponse,
)
from src.service.storage.local_storage import Storage
from src.app_types.general import STORAGE_TYPE
from src.utils import to_serializable


class SyncBase:
    def __init__(
        self,
        storage: Storage,
        qdb: QuestionDB,
        setup: SyncSetup | None = None,
        flags: Sequence[str] | None = None,
    ):
        self.storage = storage
        self.qdb = qdb
        if setup is not None:
            self.setup = setup
        else:
            self.setup = SyncSetup(
                flags=tuple(flags) if flags is not None else DEFAULT_SYNC_FLAGS
            )
        self.flags = self.setup.flags


class QuestionSyncNew(SyncBase):
    """Synchronize question folders with database records using storage metadata."""

    def __init__(
        self,
        storage: Storage,
        qdb: QuestionDB,
        flags: Sequence[str] | None = None,
        setup: SyncSetup | None = None,
    ):
        """Initialize sync service with storage, database, and metadata filename flags."""
        super().__init__(storage=storage, qdb=qdb, setup=setup, flags=flags)

    async def check_unsync(
        self, target: str, recursive: bool = False
    ) -> List[UnsyncedQuestion]:
        """Collect sync status for all question directories found under `target`."""
        if recursive:
            raise NotImplementedError("Recursive for syncing not yet resolved")

        try:
            data = self.storage.list(target, recursive=True)
            valid_questions: List[Tuple[str, str]] = []
            append_valid_question = valid_questions.append
            resolve_metadata = self._resolve_metadata
            is_dir = self.storage.is_dir

            for d in data:
                logger.info(f"This is the data {d}")
                if not is_dir(d):
                    continue
                meta = resolve_metadata(d)
                logger.debug("Current meta %s", meta)
                if meta is not None:
                    append_valid_question(meta)
            logger.debug(f"These are the valid questions {valid_questions}")

            results = await asyncio.gather(
                *[self.get_question_status(q, m) for q, m in valid_questions]
            )
            return results

        except Exception as e:
            raise ValueError(f"[QSync] Failed to check question {e}")

    async def sync_all_questions(
        self, target: str, storage_type: STORAGE_TYPE, recursive: bool = False
    ) -> SyncResponse:
        """Sync every unsynced question under `target` and return aggregate metrics."""
        unsynced = await self.check_unsync(target, recursive=recursive)
        logger.debug(f" Found {len(unsynced)} unsynced questions to process.")
        synced_results = await asyncio.gather(
            *[self.sync_single(u, storage_type) for u in unsynced]
        )

        categorized = defaultdict(list)
        for original, result in zip(unsynced, synced_results):
            categorized[result.status].append(original.question_name)
        success_count = len(categorized.get("success", []))
        failed_count = sum(len(v) for k, v in categorized.items() if k != "success")
        return SyncResponse(
            sync_metrics=SyncMetrics(
                total_found=len(unsynced),
                synced=success_count,
                failed=failed_count,
            ),
            sync_raw=synced_results,
        )

    async def sync_single(
        self, uq: UnsyncedQuestion, storage_type: STORAGE_TYPE
    ) -> UnsyncedQuestion:
        """Sync a single unsynced question payload into DB and storage."""
        # Skip any question if the question does not contain metadata
        if not uq.metadata:
            detail = f"Skipping `{uq.question_name or 'unknown question'}`: no metadata available."
            logger.warning(detail)
            uq.detail = detail
            uq.status = "missing_metadata"
            return uq

        # Try to validate the data with the question data
        try:
            metadata = json.loads(uq.metadata)
            validated = QuestionData.model_validate(metadata)
        except json.JSONDecodeError as e:
            detail = f"Invalid metadata JSON for `{uq.question_name or 'unknown question'}`: {e}"
            logger.error(detail)
            uq.detail = detail
            uq.status = "invalid_metadata_json"
            return uq
        except ValidationError as e:
            detail = f"Metadata validation failed for `{uq.question_name or 'unknown question'}`: {e}"
            logger.error(detail)
            uq.detail = detail
            uq.status = "invalid question schema"
            return uq

        # Actually sync the question
        if not uq.question_path:
            detail = f"Cannot sync `{uq.question_name or 'unknown question'}`: missing question path."
            logger.error(detail)
            uq.detail = detail
            uq.status = "failed to create question"
            return uq
        try:
            q = await self.qdb.create_question(validated)
            question_id = q.id
            old_path = uq.question_path
            normalized_old_path = old_path.rstrip("/\\")
            if "/" in normalized_old_path:
                parent, old_name = normalized_old_path.rsplit("/", 1)
                sep = "/"
            elif "\\" in normalized_old_path:
                parent, old_name = normalized_old_path.rsplit("\\", 1)
                sep = "\\"
            else:
                parent, old_name, sep = "", normalized_old_path, ""

            old_prefix = old_name.rsplit("_", 1)[0] if "_" in old_name else old_name
            new_name = f"{old_prefix}_{question_id}"
            new_path = f"{parent}{sep}{new_name}" if parent else new_name

            self.storage.move(old_path, new_path)

            try:
                await self.qdb.set_question_path(question_id, storage_type, new_path)
            except Exception:
                # Best-effort rollback to keep storage and DB state aligned.
                # if moved:
                #     try:
                #         self.storage.move(new_path, old_path)
                #     except Exception:
                #         logger.exception(
                #             f"Rollback failed after DB path update error for question `{question_id}`."
                #         )
                raise
            uq.question_path = new_path
            uq.status = "success"
            data_path = f"{new_path}/info2.json"
            data = json.dumps(to_serializable(q.model_dump()))
            self.storage.write(data_path, data)
            return uq
        except Exception as e:
            detail = (
                f"Failed to sync `{uq.question_name or 'unknown question'}` at "
                f"`{uq.question_path}`: {e}"
            )
            logger.exception(detail)
            uq.detail = detail
            uq.status = "failed to create question"
            return uq

    async def get_question_status(self, question_path: str, metadata_path: str):
        """Return sync status for a question using metadata at `metadata_path`."""
        content = self.storage.read(metadata_path)
        content = self._normalize_content(content)
        payload = UnsyncedQuestion(
            question_name=Path(question_path).name,
            question_path=question_path,
        )
        try:
            # First check. Ensure there is some metadata
            if content is None:
                detail = f"Unable to read metadata from `{metadata_path}` for `{question_path}`."
                logger.warning(detail)
                payload.detail = detail
                payload.status = "missing_metadata"
                return payload

            # Second check validate the model
            try:
                qdata = json.loads(content)
            except json.JSONDecodeError as e:
                detail = f"Invalid JSON in `{metadata_path}` for `{question_path}`: {e}"
                logger.error(detail)
                payload.detail = detail
                payload.status = "invalid_metadata_json"
                return payload

            # Third check attempt to validate with minimal requirements
            try:
                qvalidated = QuestionSyncMinimal.model_validate(qdata)
            except ValidationError as e:
                detail = (
                    f"Metadata in `{metadata_path}` for `{question_path}` does not meet "
                    f"minimal schema requirements (requires non-empty `title` and `isAdaptive` flag to be present): {e}"
                )
                logger.warning(detail)
                payload.detail = detail
                payload.status = "invalid question schema"
                payload.metadata = json.dumps(to_serializable(qdata))
                return payload
            # Check the id
            qid = qvalidated.id
            if not qid:
                detail = (
                    f"`{metadata_path}` found for {question_path}, but no 'id' key present. "
                    "This likely means the question was never inserted into the database."
                )
                logger.warning(detail)
                payload.detail = detail
                payload.status = "missing_id"
                payload.metadata = json.dumps(to_serializable(qdata))
                return payload

            # Final check, check the database for the question

            q = await self.qdb.get_question(qid)
            if q is None:
                logger.debug("Question is not in database")
                detail = (
                    f"Metadata contains Question ID {qid}, but no corresponding record was found in the database. "
                    "Run the synchronization process to register this question."
                )
                logger.warning(detail)
                payload.detail = detail
                payload.status = "not_in_database"
                payload.metadata = json.dumps(to_serializable(qdata))
                return payload
            payload.detail = f"Question `{question_path}` is already synced with database ID `{qid}`."
            payload.status = "success"
            return payload
        except Exception as e:
            detail = (
                f"Unexpected error while checking sync state for `{question_path}` "
                f"using `{metadata_path}`: {e}"
            )
            logger.exception(detail)
            payload.detail = detail
            payload.status = "failed to create question"
            return payload

    async def prune_all(
        self, target: str, storage_mode: STORAGE_TYPE
    ) -> FolderCheckMetrics:
        """Prune DB records for missing storage folders under an optional target scope."""
        try:
            all_questions = await self.qdb.get_all_questions(offset=0, limit=1000)
        except Exception as e:
            raise ValueError(f"[QSync] Failed to fetch questions for prune: {e}")

        if not all_questions:
            return FolderCheckMetrics(
                total_checked=0, deleted_from_db=0, still_valid=0, bug=0
            )

        prune_status = await asyncio.gather(
            *[self.prune_single(q, storage_mode=storage_mode, target=target) for q in all_questions]  # type: ignore[arg-type]
        )

        categorized = defaultdict(list)
        for question, status in zip(all_questions, prune_status):
            categorized[status].append(getattr(question, "title", "unknown"))

        deleted_count = len(categorized.get("deleted", []))
        still_valid = len(categorized.get("ok", []))
        bug_count = len(categorized.get("bug", []))

        return FolderCheckMetrics(
            total_checked=len(all_questions),
            deleted_from_db=deleted_count,
            still_valid=still_valid,
            bug=bug_count,
        )

    async def prune_single(
        self, question: Question, storage_mode: STORAGE_TYPE, target: str | None = None
    ) -> Literal["ok", "deleted", "bug"]:
        """Prune one question if its storage path no longer exists."""
        try:
            if question.id is None:
                logger.warning("[QSync] Cannot prune question with missing ID")
                return "bug"

            storage_path = await self.qdb.get_question_path(question.id, storage_mode)

            if storage_path is None:
                deleted = await self.qdb.delete_question(question.id)
                return "deleted" if deleted else "bug"

            if target:
                normalized_target = target.replace("\\", "/").lstrip("/")
                if normalized_target and not normalized_target.endswith("/"):
                    normalized_target += "/"
                normalized_path = storage_path.replace("\\", "/").lstrip("/")
                if normalized_target and not normalized_path.startswith(
                    normalized_target
                ):
                    return "ok"

            if self.storage.exists(storage_path):
                return "ok"

            deleted = await self.qdb.delete_question(question.id)
            return "deleted" if deleted else "bug"
        except Exception as e:
            logger.exception(
                f"[QSync] Failed to prune question `{getattr(question, 'id', 'unknown')}`: {e}"
            )
            return "bug"

    def _normalize_content(
        self, content: str | bytes | dict | bytearray
    ) -> Optional[str]:
        """Normalize storage-read metadata into a JSON string when possible."""
        try:
            if isinstance(content, str):
                return content
            elif isinstance(content, (bytes, bytearray)):
                return content.decode()
            elif isinstance(content, (dict)):
                return json.dumps(content)
            else:
                raise TypeError(f"[QSync] Content is invalid type {type(content)}")
        except Exception as e:
            logger.error(
                f"[QSync] Failed to normalize content in  metadata in {content}: {e}"
            )
            return None

    def _resolve_metadata(self, target: str) -> tuple[str, str] | None:
        """Return the first `(question_base_path, metadata_path)` found under `target`.

        This only scans one directory level below `target` and checks files in `self.flags`
        order. Returns `None` when no metadata file is found.
        """
        try:
            # Only check the first level
            dirs = set()
            for path in self.storage.list(target, recursive=True):
                p = PurePosixPath(path)
                dirs.add(str(p.parent) + "/")
            for d in dirs:
                for f in self.flags:
                    target_meta = str(PurePosixPath(d) / f)
                    if self.storage.exists(target_meta):
                        return d, target_meta

        except Exception as e:
            logger.error(f"[QSync] Failed to resolve metadata in {target}: {e}")
            return None


# # For testing
# async def main():
#     from src.web.dependencies import get_question_manager, get_storage_manager

#     print("Running")

#     session_gen = get_session()
#     session = next(session_gen)

#     try:
#         q = QuestionSync(
#             storage=get_storage_manager(),
#             qr=get_question_manager(session),
#         )
#         await q.check_all_unsync()

#     finally:
#         session_gen.close()


if __name__ == "__main__":
    # asyncio.run(main())
    print("Running Sync in file")
