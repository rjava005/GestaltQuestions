# --- Third-Party ---
from fastapi import APIRouter, HTTPException
from starlette import status
from typing import Sequence

# --- Internal ---
from src.core import logger
from src.model.question import Question
from src.types import QuestionData
from src.utils import safe_dir_name
from src.web.dependencies import (
    StorageTypeDep,
    QuestionDBDependency,
    QuestionManagerDependency,
    StorageDependency,
)
from src.types import ID


router = APIRouter(
    prefix="/questions",
    tags=["questions", "database"],
)


@router.post("/")
async def create_question(
    qs: QuestionManagerDependency,
    question: QuestionData,
) -> Question:
    """
    Create a new question, store it in the database, and initialize its corresponding storage path.

    This function performs three main operations:
    1. Creates a new `Question` entry in the database via the `QuestionManagerDependency`.
    2. Generates a sanitized directory name for the question based on its title and ID.
    3. Initializes the appropriate storage path (local or cloud) and updates the database record
       with the correct relative path reference.

    Args:
        qm (QuestionManagerDependency):
        storage (StorageDependency):
        question (QuestionData): Input data model containing details of the question to be created.

    Returns:
        Question: The created `Question` SQLModel instance with updated storage path information.

    Raises:
        Exception: Propagates any error encountered during creation or storage initialization.
    """
    try:
        qcreated = await qs.create_question(question, files=None)
        return qcreated
    except Exception:
        raise


@router.get("/{offset:int}/{limit:int}")
async def get_all_questions(
    qdb: QuestionDBDependency, offset: int = 0, limit: int = 100
) -> Sequence[Question | QuestionData]:
    """
    Retrieve a paginated list of all questions stored in the database.

    This endpoint queries the database for all available questions using pagination controls.
    It is primarily used for listing or browsing questions in bulk, supporting efficient
    batch retrieval through the `offset` and `limit` parameters.

    Args:
        qm (QuestionManagerDependency): Dependency responsible for database queries related to questions.
        offset (int, optional): The starting index for pagination. Defaults to 0.
        limit (int, optional): The maximum number of questions to retrieve. Defaults to 100.

    Returns:
        Sequence[Question]: A sequence of `Question` SQLModel instances representing the retrieved questions.

    Raises:
        Exception: Propagates any unexpected database or query-related errors during retrieval.
    """
    try:
        return await qdb.get_all_questions(offset, limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to get all questions {e}",
        )


@router.get("/{id}")
async def get_question(id: ID, qdb: QuestionDBDependency) -> Question:
    """
    Retrieve a single question from the database by its ID.

    This endpoint queries the database for a specific `Question` instance.
    If no question is found matching the provided identifier, an HTTP 404 error is raised.

    Args:
        id (ID): The unique identifier of the question to retrieve.
        qm (QuestionManagerDependency): Manages database operations for question retrieval.

    Returns:
        Question: The retrieved `Question` SQLModel instance.

    Raises:
        HTTPException: If the question does not exist in the database.
        Exception: Propagates any unexpected database or retrieval errors.
    """
    try:
        question = await qdb.get_question(id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Could not find question {id}",
            )
        return question
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get question {e}")


@router.get("/{id}/all_data")
async def get_question_all_data(
    id: ID, qdb: QuestionDBDependency, STORAGE_TYPE: StorageTypeDep
) -> QuestionData:
    """
    Retrieve a question and all associated metadata by its ID.

    This function fetches both the question record and its related metadata
    (such as relationships, tags, and supplemental data) for comprehensive inspection.

    Args:
        id (ID): The unique identifier of the question to retrieve.
        qm (QuestionManagerDependency): Provides access to detailed question data and metadata.

    Returns:
        QuestionMeta: The combined question and metadata information.

    Raises:
        Exception: Propagates any database or data access errors encountered during retrieval.
    """
    try:
        question_data = await qdb.get_question_data(id)
        question_data.question_path = await qdb.get_question_path(id, STORAGE_TYPE)
        return question_data
    except Exception:
        raise


@router.get("/{offset:int}/{limit:int}/all_data")
async def get_all_questions_data(
    qdb: QuestionDBDependency, offset: int, limit: int
) -> Sequence[QuestionData | Question]:

    data = await qdb.get_all_questions(offset, limit, method="full")
    if not isinstance(data, list):
        raise HTTPException(status_code=500, detail="Invalid data format")
    if not all([isinstance(q, QuestionData) for q in data]):
        raise HTTPException(
            status_code=500,
            detail=f"Invalid data format expected type of QuestionData",
        )

    return data


@router.delete("/{id}")
async def delete_question(id: ID, qr: QuestionManagerDependency):
    """
    Delete a question from the database and remove any associated stored files.

    This endpoint performs two operations:
    1. Retrieves the question by ID and ensures it exists.
    2. Deletes the database record and removes its storage location (local or cloud),
       depending on the active storage backend.

    If the question exists in the DB but does not have an associated storage path,
    the question is still deleted from the database, and a warning is logged to indicate
    that storage cleanup could not be performed.

    Args:
        id (ID): The unique identifier of the question to delete.
        qm (QuestionManagerDependency): Handles database deletion of the question.
        storage (StorageDependency): Deletes storage resources, either locally or in cloud storage.

    Returns:
        dict: A confirmation response indicating successful deletion.

    Raises:
        HTTPException: If the question does not exist.
        Exception: Propagates any unexpected errors encountered during deletion.
    """
    try:
        return await qr.delete_question(id)
    except Exception:
        raise


@router.put("/{id}")
async def update_question(
    id: ID,
    update: QuestionData,
    qm: QuestionManagerDependency,
    storage: StorageDependency,
    STORAGE_TYPE: StorageTypeDep,
    update_storage: bool = True,
) -> QuestionData:
    """
    Update a question in the database and optionally rename its associated storage directory.

    This endpoint updates a question’s database record and, if `update_storage` is enabled,
    renames the corresponding storage directory to reflect an updated title.
    The storage update ensures that both local and cloud storage paths remain consistent
    with the question’s current metadata.

    Args:
        id (ID): Unique identifier of the question to update.
        update (QuestionData): Updated data for the question.
        qm (QuestionManagerDependency): Handles database operations related to questions.
        storage (StorageDependency): Manages storage paths and renaming operations.
        update_storage (bool): If True, renames the existing storage directory when the title changes.

    Returns:
        Question: The updated question model instance from the database.

    Raises:
        HTTPException: If the question cannot be found or an update operation fails.
        Exception: For any other unexpected errors during the update or rename process.
    """
    try:
        existing_question = await qm.qdb.get_question(id)
        if not existing_question:
            logger.warning(f"Question with ID {id} not found — cannot update.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Question {id} not found.",
            )

        # Handle renaming the storage directory if required
        if update_storage and update.title:
            logger.info(
                f"Updating storage directory for question '{existing_question.title}' → '{update.title}'"
            )

            old_storage_path = qm.get_question_path(id, STORAGE_TYPE)
            if not old_storage_path:
                logger.error(f"No valid storage path found for question ID {id}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Storage path missing for question {id}.",
                )

            # Generate a sanitized new directory name and resolve paths
            new_storage_name = safe_dir_name(f"{update.title}_{str(id)[:8]}")
            new_storage_path = storage.rename_storage(
                old_storage_path, new_storage_name
            )

            # Update the question's stored path reference
            updated_relative_path = storage.get_storage_path(
                new_storage_path, relative=True
            )
            qm.set_question_path(
                existing_question.id, updated_relative_path, STORAGE_TYPE
            )
            qm.session.commit()

            logger.info(
                f"Renamed storage path for question {id}: {old_storage_path} → {new_storage_path}"
            )

        # Proceed with updating database fields
        updated_question = await qm.qdb.update_question(id, update)
        logger.info(f"Successfully updated question {id}")

        return updated_question

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error while updating question {id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update question {e}")


@router.post("/filter")
async def filter_questions(
    filter_data: QuestionData, qm: QuestionManagerDependency
) -> Sequence[QuestionData]:
    try:
        logger.debug("Retrieved filter %s", filter_data)
        return await qm.qdb.filter_questions(filter_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to filter question {e}")
