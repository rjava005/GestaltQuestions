from typing import Any, Dict, Sequence

from sqlalchemy import desc
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import select

from src.app_types.general import ID
from src.core import SessionDep, logger
from src.model.question_attempt import QuestionAttempt
from src.utils import convert_uuid


class QuestionAttemptDB:
    def __init__(self, session: SessionDep):
        self.session = session

    async def create_attempt(
        self,
        question_id: ID,
        user_id: ID,
        quiz_data: Dict[str, Any],
        submitted_answer: Dict[str, Any],
    ) -> QuestionAttempt:
        attempt = QuestionAttempt(
            question_id=convert_uuid(question_id),
            user_id=convert_uuid(user_id),
            quiz_data=quiz_data,
            submitted_answer=submitted_answer,
            is_correct=False,
        )

        try:
            self.session.add(attempt)
            self.session.commit()
            self.session.refresh(attempt)

            logger.debug(
                "[DB] Created question attempt | question_id=%s user_id=%s attempt_id=%s",
                attempt.question_id,
                attempt.user_id,
                attempt.id,
            )

            return attempt

        except SQLAlchemyError as e:
            self.session.rollback()

            logger.exception(
                "[DB] Failed to create question attempt | question_id=%s user_id=%s",
                question_id,
                user_id,
            )

            raise RuntimeError("Failed to create question attempt") from e

    async def get_attempts_by_user(self, user_id: ID) -> Sequence[QuestionAttempt]:
        try:
            stmt = select(QuestionAttempt).where(
                QuestionAttempt.user_id == convert_uuid(user_id)
            )
            results = self.session.exec(stmt).all()

            logger.debug(
                "[DB] Retrieved %d attempts for user | user_id=%s",
                len(results),
                user_id,
            )

            return results

        except SQLAlchemyError as e:
            self.session.rollback()

            logger.exception(
                "[DB] Failed to retrieve attempts for user | user_id=%s",
                user_id,
            )

            raise RuntimeError("Failed to retrieve attempts for user") from e

    async def get_attempts_by_question(
        self, question_id: ID
    ) -> Sequence[QuestionAttempt]:
        try:
            stmt = select(QuestionAttempt).where(
                QuestionAttempt.question_id == convert_uuid(question_id)
            )
            results = self.session.exec(stmt).all()

            logger.debug(
                "[DB] Retrieved %d attempts for question | question_id=%s",
                len(results),
                question_id,
            )

            return results

        except SQLAlchemyError as e:
            self.session.rollback()

            logger.exception(
                "[DB] Failed to retrieve attempts for question | question_id=%s",
                question_id,
            )

            raise RuntimeError("Failed to retrieve attempts for question") from e

    async def get_attempt_by_user_and_question(
        self, question_id: ID, user_id: ID
    ) -> Sequence[QuestionAttempt]:
        try:
            stmt = select(QuestionAttempt).where(
                QuestionAttempt.question_id == convert_uuid(question_id)
                and QuestionAttempt.user_id == convert_uuid(user_id)
            )
            results = self.session.exec(stmt).all()
            logger.debug(
                "[DB] Retrieved %d attempts for question | question_id=%s",
                len(results),
                question_id,
            )
            return results
        except SQLAlchemyError as e:
            self.session.rollback()

            logger.exception(
                "[DB] Failed to retrieve attempts for question | question_id=%s",
                question_id,
            )

            raise RuntimeError("Failed to retrieve attempts for question") from e

    async def get_latest_attempt(
        self, question_id: ID, user_id: ID
    ) -> QuestionAttempt | None:
        try:
            stmt = (
                select(QuestionAttempt)
                .where(
                    QuestionAttempt.question_id == convert_uuid(question_id),
                    QuestionAttempt.user_id == convert_uuid(user_id),
                )
                .order_by(desc(QuestionAttempt.attemption_time))  # type: ignore
            )

            attempt = self.session.exec(stmt).first()

            logger.debug(
                "[DB] Retrieved latest attempt | question_id=%s user_id=%s found=%s",
                question_id,
                user_id,
                attempt is not None,
            )

            return attempt

        except SQLAlchemyError as e:
            self.session.rollback()

            logger.exception(
                "[DB] Failed to retrieve latest attempt | question_id=%s user_id=%s",
                question_id,
                user_id,
            )

            raise RuntimeError("Failed to retrieve latest attempt") from e
