# --- Standard Library ---
import asyncio
import json
from collections import defaultdict
from typing import Literal, Sequence, Union, Tuple
from pathlib import Path

# --- Third-Party ---
from pydantic import ValidationError

# --- Internal ---
from src.api.core import logger
from src.api.database.models.question import Question, QuestionData
from src.api.response_models.sync_models import (
    UnsyncedQuestion,
    SyncMetrics,
    FolderCheckMetrics,
)
from src.utils import to_serializable
from src.api.service.storage_manager import StorageDependency, get_storage_manager
from src.api.service.question_resource import (
    QuestionResourceDepencency,
    get_question_resource,
)
from src.api.core.database import get_session


class QuestionSync:
    def __init__(
        self,
        storage: StorageDependency,
        qr: QuestionResourceDepencency,
        flag: Sequence[str] = [
            "info2.json",
            "metadata.json",
            "info.json",
        ],
    ):
        self.storage = storage
        self.qr = qr
        # Checks to ensure that the path exist
        self.path = Path(self.storage.get_base_path())
        if not self.path.exists():
            raise ValueError(f"The path {self.path} does not exist cannot perform sync")
        logger.info(f"Initizalized the path to {self.path}")
        self.flags = flag

    async def check_all_unsync(self) -> Sequence[UnsyncedQuestion]:
        """Checks the given directory for the sync"""
        try:
            data = self.storage.iterate(self.path, recursive=True)
            valid_questions = [
                q for d in data if (q := self.find_question_directory(d)) is not None
            ]
            results = await asyncio.gather(
                *[self.get_question_status(Path(p)) for p in valid_questions]
            )
            return [r for r in results if isinstance(r, UnsyncedQuestion)]
        except Exception as e:
            logger.error(f"Could not check unsynced questions: {e}")
            raise e

    async def sync_all_questions(
        self,
    ) -> Tuple[SyncMetrics, Sequence[UnsyncedQuestion]]:
        unsynced = await self.check_all_unsync()
        logger.info(f" Found {len(unsynced)} unsynced questions to process.")
        synced_results = await asyncio.gather(
            *[self.sync_question(u) for u in unsynced]
        )
        categorized = defaultdict(list)
        for original, result in zip(unsynced, synced_results):
            categorized[result.status].append(original.question_name)
        success_count = len(categorized.get("success", []))
        failed_count = sum(len(v) for k, v in categorized.items() if k != "success")
        return (
            SyncMetrics(
                total_found=len(unsynced),
                synced=success_count,
                failed=failed_count,
            ),
            synced_results,
        )

    async def prune_all(self) -> FolderCheckMetrics:
        """Prunes any missing questions"""
        all_questions = self.qr.qm.get_all_questions(
            0,
            1000,
        )
        if not all_questions:
            logger.info("📂 No questions found in the database.")
            return FolderCheckMetrics(
                total_checked=0,
                deleted_from_db=0,
                still_valid=0,
            )
        total_checked = len(all_questions)
        prune_status = await asyncio.gather(
            *[self.prune_question(q) for q in all_questions]
        )
        categorized = defaultdict(list)
        for question, status in zip(all_questions, prune_status):
            categorized[status].append(question.title)
        deleted_count = len(categorized.get("delete", []))
        still_valid = len(categorized.get("ok", []))
        bug = len(categorized.get("bug", []))
        metrics = FolderCheckMetrics(
            total_checked=total_checked,
            deleted_from_db=deleted_count,
            still_valid=still_valid,
            bug=bug,
        )
        return metrics

    async def prune_question(self, q: Question) -> Literal["ok", "deleted", "bug"]:
        try:
            qdb = await self.qr.does_question_path_exist(q.id)  # type: ignore
            if qdb:
                return "ok"
            else:
                # Just delete from database record, this should eventually be more robust but it should work
                self.qr.qm.delete_question(q.id)
                return "deleted"
        except Exception as e:
            logger.exception(f"⚠️ Failed to delete '{q.title}' from DB: {e}")
            return "bug"

    async def get_question_status(
        self, question_dir: Path
    ) -> Union["Question", "UnsyncedQuestion"]:
        metadata = self.resolve_metadata_path(question_dir)
        question_name = question_dir.name
        question_path = question_dir.as_posix()
        payload = {
            "question_name": question_name,
            "question_path": question_path,
            "detail": "",
            "status": "failed to create question",
            "metadata": None,
        }
        if metadata is None:
            detail = (
                f"No `{self.flags}` found in {question_dir.name}. "
                "This question cannot be indexed or referenced until metadata is generated."
            )
            logger.warning(detail)
            payload["detail"] = detail
            payload["status"] = "missing_metadata"
            return UnsyncedQuestion(**payload)
        try:
            question_data = json.loads(metadata.read_text())
        except json.JSONDecodeError as e:
            detail = f"Failed to parse JSON in {self.flags}: {e}"
            logger.error(detail)
            payload["detail"] = detail
            payload["status"] = "invalid_metadata_json"
            return UnsyncedQuestion(**payload)
        # Check if there is a id in the question data
        question_id = question_data.get("id", None)
        if not question_id:
            detail = (
                f"`{self.flags}` found for {question_dir.name}, but no 'id' key present. "
                "This likely means the question was never inserted into the database."
            )
            logger.warning(detail)
            payload["detail"] = detail
            payload["status"] = "missing_id"
            payload["metadata"] = json.dumps(to_serializable(question_data))
            return UnsyncedQuestion(**payload)
        logger.info(f"Found Question ID: {question_id}")
        try:
            qdb = self.qr.qm.get_question(question_id)
        except Exception:
            logger.info("Question is not in database")
            detail = (
                f"Metadata contains Question ID {question_id}, but no corresponding record was found in the database. "
                "Run the synchronization process to register this question."
            )
            logger.warning(detail)
            payload["detail"] = detail
            payload["status"] = "not_in_database"
            payload["metadata"] = json.dumps(to_serializable(question_data))
            return UnsyncedQuestion(**payload)
        logger.info(
            f"✅ Question {question_name} is properly synced with the database (ID: {question_id})"
        )
        return qdb

    async def sync_question(self, unsynced: UnsyncedQuestion):
        # Check metadata
        if not getattr(unsynced, "metadata", None):
            logger.warning(
                f"⏩ Skipping {unsynced.question_name}: no metadata available."
            )
            return unsynced
        # Validate that the metadata is the right type
        try:
            metadata_dict = json.loads(str(unsynced.metadata))
            qvalidated = QuestionData.model_validate(
                metadata_dict, context={"extra": "ignore"}
            )
        except json.JSONDecodeError as e:
            detail = f"Invalid JSON for {unsynced.question_name}: {e}"
            logger.error(detail)
            unsynced.detail = detail
            return unsynced
        except ValidationError as e:
            detail = f"Validation failed for {unsynced.question_name}: {e}"
            logger.error("detail")
            unsynced.detail = detail
            return unsynced
        # First try to create the question in the database
        try:
            old_path = unsynced.question_path
            qcreated, new_path = await self.qr.sync_question(qvalidated, old_path)
            question_path = (
                str(new_path) if isinstance(new_path, str) else new_path.as_posix()
            )
            logger.info(f"✅ Synced question: {unsynced.question_name}")
            return UnsyncedQuestion(
                question_name=str(qcreated.title),
                question_path=question_path,
                detail="Successfully Synced",
                status="success",
                metadata=None,
            )
        except Exception as e:
            return UnsyncedQuestion(
                question_name=unsynced.question_name,
                question_path=unsynced.question_path,
                detail=f"Failed to sync question {e}",
                status="failed to create question",
                metadata=unsynced.metadata,
            )

    def resolve_metadata_path(self, question_dir: Path) -> Path | None:
        """
        Resolve the authoritative metadata file for a question.

        Priority:
        1. Synced metadata (contains DB ID)
        2. Base metadata (legacy / no ID)
        """

        for f in self.flags:
            meta_path = question_dir / f
            if meta_path.exists():
                logger.info(f"Using authoritative metadata: {f}")
                return meta_path

        return None

    def find_question_directory(self, question_dir: Path) -> str | None:
        "Uses the flag to determine if any of the flags exist"
        root = Path(question_dir)
        if root.is_dir():
            for f in self.flags:
                if (root / f).exists():
                    return root.as_posix()
        return None


# For testing
async def main():
    print("Running")

    session_gen = get_session()
    session = next(session_gen)

    try:
        q = QuestionSync(
            storage=get_storage_manager(),
            qr=get_question_resource(session),
        )
        await q.check_all_unsync()

    finally:
        session_gen.close()


if __name__ == "__main__":
    asyncio.run(main())
