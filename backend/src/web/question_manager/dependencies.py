from typing import Annotated

from fastapi import Depends

from src.service.question_manager.developer_question_service import (
    DeveloperQuestionService,
)
from src.web.user.dependencies import DeveloperAccess
from src.web.dependencies import StorageDependency, SessionDep, QuestionDBDependency
from src.service.question_manager.question_manager import QuestionManager


def get_question_manager(
    storage: StorageDependency,
    question_db: QuestionDBDependency,
) -> QuestionManager:
    return QuestionManager(storage=storage, qdb=question_db)


QuestionManagerDependency = Annotated[QuestionManager, Depends(get_question_manager)]


def get_dev_question_manager(
    session: SessionDep,
    qm: QuestionManagerDependency,
    dev_access: DeveloperAccess,
) -> DeveloperQuestionService:

    return DeveloperQuestionService(
        session=session, developer_access=dev_access, question_manager=qm
    )


DeveloperQuestionManagerDependency = Annotated[
    DeveloperQuestionService, Depends(get_dev_question_manager)
]
