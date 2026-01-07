# --- Standard Library ---
from typing import Any, Dict, Sequence
from uuid import UUID

# --- Third-Party ---
from sqlmodel import desc, select

# --- Internal ---
from src.api.core import SessionDep
from src.utils import convert_uuid

from .models.question_attempt import QuestionAttempt


ID = str | UUID


def create_attempt(
    question_id: ID,
    user_id: ID,
    quiz_data: Dict[str, Any],
    submitted_answer: Dict[str, Any],
    session: SessionDep,
) -> QuestionAttempt:
    attempt = QuestionAttempt(
        question_id=convert_uuid(question_id),
        user_id=convert_uuid(user_id),
        quiz_data=quiz_data,
        submitted_answer=submitted_answer,
        is_correct=False,
    )
    session.add(attempt)
    session.commit()
    session.refresh(attempt)
    return attempt


def get_attempt_by_user(user_id: ID, session: SessionDep) -> Sequence[QuestionAttempt]:
    """Retrieves all the submission attempts of a user. This is a general one

    Args:
        user_id (ID): The ID of the user
        session (SessionDep): The database session

    Returns:
        _type_: _description_
    """
    stmt = select(QuestionAttempt).where(user_id == convert_uuid(user_id))
    results = session.exec(stmt).all()
    return results


def get_attemps_by_question(
    question_id: ID, session: SessionDep
) -> Sequence[QuestionAttempt]:
    stmt = select(QuestionAttempt).where(question_id == convert_uuid(question_id))
    results = session.exec(stmt).all()
    return results


def get_attempt_by_user_and_question(
    question_id: ID, user_id: ID, session: SessionDep
) -> Sequence[QuestionAttempt]:
    stmt = select(QuestionAttempt).where(
        question_id == convert_uuid(question_id) and user_id == convert_uuid(user_id)
    )
    return session.exec(stmt).all()


def get_latest_attemp():
    stmt = (
        select(QuestionAttempt)
        .where(
            question_id == convert_uuid(question_id)
            and user_id == convert_uuid(user_id)
        )
        .order_by(desc(QuestionAttempt.attemption_time))
    )
    return session.exec(stmt).all()
