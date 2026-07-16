from typing import overload

from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, select

from backend.core import logger
from backend.question.models import QuestionType
from backend.question.schema import QType
from backend.shared import ID
from backend.utils import convert_uuid


class QuestionQTypeDB:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, t: QType, description: str | None = None) -> QuestionType:
        qtype = QuestionType(
            name=t, description=description, display_name=t.display_name
        )
        try:
            self._session.add(qtype)
            self._session.commit()
            self._session.refresh(qtype)
            return qtype
        except SQLAlchemyError as e:
            self._session.rollback()
            logger.exception("[QuestionQTypeDB] Failed to create question")
            raise ValueError("Failed to create qtype") from e

    @overload
    def get_qtype(self, identifier: QType) -> QuestionType | None: ...
    @overload
    def get_qtype(self, identifier: ID) -> QuestionType | None: ...

    def get_qtype(self, identifier: ID | QType) -> QuestionType | None:
        try:
            if isinstance(identifier, QType):
                return self._session.exec(
                    select(QuestionType).where(QuestionType.name == identifier)
                ).first()
            if not identifier:
                raise ValueError("[DB] Identifier cannot be none")
            identifier_id = convert_uuid(identifier)
            return self._session.exec(
                select(QuestionType).where(QuestionType.id == identifier_id)
            ).first()

        except SQLAlchemyError as e:
            logger.error(f"[DB] Could not get institution: {e}")
            raise

    def get_qtype_by_name(self, name: QType | str) -> QuestionType | None:
        qtype = name if isinstance(name, QType) else QType(name.lower())
        return self._session.exec(
            select(QuestionType).where(QuestionType.name == qtype)
        ).first()

    def seed_types(self) -> None:
        valid_types: dict[QType, str] = {
            QType.MC: "A question where the learner selects one correct option from a set of choices.",
            QType.MCQ: "A multiple choice question with one correct answer among several options.",
            QType.MA: "A question where the learner selects all correct options from a set of choices.",
            QType.TF: "A question where the learner determines whether a statement is true or false.",
            QType.FB: "A question where the learner completes missing text in a prompt.",
            QType.NUM: "A question where the learner provides a numeric answer.",
        }
        for qtype, description in valid_types.items():
            if not self.get_qtype(qtype):
                self.create(qtype, description)
