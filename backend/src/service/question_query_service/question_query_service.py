from typing import List

from src.model.institution import Institution
from src.model.users import DeveloperProfile, User
from src.model.question import Question, QuestionTableRow, Status
from sqlmodel import select, join, Session
from sqlalchemy import func


class QuestionQueryService:
    def __init__(self, session: Session):
        self.session = session

    async def get_table(self) -> List[QuestionTableRow]:
        stmt = (
            select(
                Question.title,
                Question.id,
                Question.isAdaptive,
                Question.ai_generated,
                Question.status,
                DeveloperProfile.user_id,
                User.email,
                Institution.name,
            )  # type: ignore  # type: ignore
            .join(DeveloperProfile, DeveloperProfile.id == Question.created_by_id)
            .join(User, User.id == DeveloperProfile.user_id)
            .join(Institution, Institution.id == User.institution_id)
        )
        results = self.session.exec(stmt).all()

        return self._parse_results(results)

    async def filter_questions(
        self,
        title: str,
    ) -> List[QuestionTableRow]:
        stmt = (
            select(
                Question.title,
                Question.id,
                Question.isAdaptive,
                Question.ai_generated,
                Question.status,
                DeveloperProfile.user_id,
                User.email,
                Institution.name,
            )  # type: ignore
            .where(Question.status == "published")
            .join(DeveloperProfile, DeveloperProfile.id == Question.created_by_id)
            .join(User, User.id == DeveloperProfile.user_id)
            .join(Institution, Institution.id == User.institution_id)
        ).where(func.lower(Question.title).like(f"%{title.lower()}%"))
        results = self.session.exec(stmt).all()
        return self._parse_results(results)

    def _parse_results(self, results) -> List[QuestionTableRow]:
        parsed = [
            QuestionTableRow(
                **{
                    "title": r[0],
                    "question_id": r[1],
                    "isAdaptive": r[2],
                    "ai_generated": r[3],
                    "status": r[4],
                    "user_id": r[5],
                    "created_by": r[6],
                    "institution": r[7],
                }
            )
            for r in results
        ]
        return parsed
