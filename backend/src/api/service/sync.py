# --- Standard Library ---
import asyncio
import json
from collections import defaultdict
from typing import List, Literal, Sequence, Union, Tuple
from pathlib import Path
# --- Third-Party ---
from pydantic import ValidationError

# --- Internal ---
from src.api.core import logger
from src.api.models.question import Question
from src.api.response_models.sync_models import *
from src.api.service.question_manager import (
    QuestionManagerDependency,
)
from src.utils import to_serializable
from src.api.service.storage_manager import StorageDependency
from src.api.service.question_resource import QuestionResourceDepencency


metadata_name = ["metadata.json", "info.json", "info2.json"]
excluded_path_names = ["downloads"]

# Utils for resolving


def find_question_dir(
    root: str | Path, required_file: List[str] = metadata_name
) -> str | None:
    root = Path(root)
    if root.is_dir():
        for f in required_file:
            if (root / f).exists():
                return root.as_posix()


async def resolve_metadata_path(
    question_dir: Path, metadata_name: List[str] = metadata_name
) -> Path | None:
    for m in metadata_name:
        metadata_path = question_dir / m
        if metadata_path.exists():
            logger.info(f"Found metadata path for filename {m}")
            return metadata_path
    return None


#
# ----------Checking -----------------
#
# These section is focused on checking the questions founc in the directory
async def check_unsync(
    storage: StorageDependency, qm: QuestionManagerDependency
) -> Sequence[UnsyncedQuestion]:
    """
    Recursively scan the storage for valid question directories and check
    whether any of them are out-of-sync with the database.

    A "valid" question directory is currently identified by the presence
    of required metadata files (e.g., `info.json`). Each detected question
    directory is passed to `check_question_sync_status()` to determine its
    sync status.
    """
    try:
        # Get the root storage path where all question content is stored.
        # This may be a local filesystem path (e.g. C:/Data/Questions)
        # or a cloud path (e.g. firebase/Data/User/Questions).
        base_storage_path = storage.get_base_path()
        logger.info(f"Checking the path {base_storage_path}")

        # Ensure the path exists or create it.
        path = Path(storage.ensure_storage_path(base_storage_path))

        # Recursively iterate through the entire directory tree.
        data = storage.iterate(path, recursive=True)

        # Identify directories that represent valid question folders.
        # A "valid" folder is one containing required metadata files.
        question_dirs = []
        for d in data:
            valid_dir = find_question_dir(d)
            if valid_dir:
                question_dirs.append(valid_dir)

        # Prepare sync-check tasks for each valid question directory.
        tasks = [
            check_question_sync_status(Path(p), qm)
            for p in question_dirs
            if Path(p).name not in excluded_path_names
        ]

        # Execute tasks concurrently.
        results = await asyncio.gather(*tasks)

        # Filter out only UnsyncedQuestion objects.
        return [r for r in results if isinstance(r, UnsyncedQuestion)]

    except Exception as e:
        logger.error(f"Could not check unsynced questions: {e}")
        raise e


async def check_question_sync_status(
    question_dir: Path,
    qm: QuestionManagerDependency,
    metadata_name: List[str] = metadata_name,
) -> Union["Question", "UnsyncedQuestion"]:
    """
    Verify if a given question folder is properly synchronized with the database.

    The function performs the following checks:
    1. Ensures `metadata.json` exists.
    2. Verifies that the file contains a valid question ID.
    3. Confirms that the ID corresponds to an entry in the database.

    Returns:
        - `Question`: if the question is properly synced with the DB.
        - `UnsyncedQuestion`: with detailed reasoning if not synced.
    """
    metadata = await resolve_metadata_path(question_dir)
    question_name = question_dir.name
    question_path = question_dir.as_posix()

    # Create a payload this will be use as the unsynced question response
    payload = {
        "question_name": question_name,
        "question_path": question_path,
        "detail": "",
        "status": "failed to create question",
        "metadata": None,
    }
    # Check if metadata is present
    if metadata is None:
        detail = (
            f"No `{metadata_name}` found in {question_dir.name}. "
            "This question cannot be indexed or referenced until metadata is generated."
        )
        logger.warning(detail)
        payload["detail"] = detail
        payload["status"] = "missing_metadata"
        return UnsyncedQuestion(**payload)

    try:
        question_data = json.loads(metadata.read_text())
    except json.JSONDecodeError as e:
        detail = f"Failed to parse JSON in {metadata_name}: {e}"
        logger.error(detail)
        payload["detail"] = detail
        payload["status"] = "invalid_metadata_json"
        return UnsyncedQuestion(**payload)

    # Check if there is a id in the question data
    question_id = question_data.get("id", None)
    if not question_id:
        detail = (
            f"`{metadata_name}` found for {question_dir.name}, but no 'id' key present. "
            "This likely means the question was never inserted into the database."
        )
        logger.warning(detail)
        payload["detail"] = detail
        payload["status"] = "missing_id"
        payload["metadata"] = json.dumps(to_serializable(question_data))
        return UnsyncedQuestion(**payload)

    logger.info(f"Found Question ID: {question_id}")

    # --- Step 3: Confirm question exists in DB ---
    try:
        qdb = qm.get_question(question_id)
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


#
# ------------Actual Syncing--------------
#


async def sync_question(
    unsynced: UnsyncedQuestion, qr: QuestionResourceDepencency
) -> UnsyncedQuestion:

    # Check metadata
    if not getattr(unsynced, "metadata", None):
        logger.warning(f"⏩ Skipping {unsynced.question_name}: no metadata available.")
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
        qcreated, new_path = await qr.sync_question(qvalidated, old_path)
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
            detail="Failed to sync question {e}",
            status="failed to create question",
            metadata=unsynced.metadata,
        )


async def sync_questions(
    qr: QuestionResourceDepencency,
) -> Tuple[SyncMetrics, Sequence[UnsyncedQuestion]]:
    unsynced_questions: Sequence[UnsyncedQuestion] = await check_unsync(
        qr.storage_manager, qr.qm
    )

    logger.info(f" Found {len(unsynced_questions)} unsynced questions to process.")

    sync_results = await asyncio.gather(
        *[sync_question(q, qr) for q in unsynced_questions]
    )

    categorized = defaultdict(list)

    # FIX: Use the status string, not the entire UnsyncedQuestion object
    for original, result in zip(unsynced_questions, sync_results):
        categorized[result.status].append(original.question_name)

    success_count = len(categorized.get("success", []))
    failed_count = sum(len(v) for k, v in categorized.items() if k != "success")

    return (
        SyncMetrics(
            total_found=len(unsynced_questions),
            synced=success_count,
            failed=failed_count,
        ),
        sync_results,
    )


async def prune_question(
    q: Question, qr: QuestionResourceDepencency
) -> Literal["ok", "deleted", "bug"]:
    try:
        # Check that the question has a path
        if await qr.does_question_path_exist(q.id):  # type: ignore
            return "ok"
        else:
            # Just delete from database record, this should eventually be more robust but it should work
            qr.qm.delete_question(q.id)
            return "deleted"
    except Exception as e:
        logger.exception(f"⚠️ Failed to delete '{q.title}' from DB: {e}")
        return "bug"


async def prune_questions(qr: QuestionResourceDepencency) -> FolderCheckMetrics:
    all_questions = qr.qm.get_all_questions(
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
    prune_status = await asyncio.gather(*[prune_question(q, qr) for q in all_questions])

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
