import asyncio
from typing import Sequence

from sqlalchemy import or_
from sqlmodel import Session, select

from src.data import generic as gdb
from src.model.question import (
    Question,
    QuestionRead as QuestionData,
    QuestionType,
    Topic,
)
from src.utils import convert_uuid

METADATA_REL = ["topics", "languages", "qtypes"]
RELATIONSHIP_MAP = {
    "topics": (Topic, "name"),
    "qtypes": (QuestionType, "name"),
}


async def get_question_relationship_data(question: Question) -> dict[str, list[str]]:
    topics = await gdb.get_relationship_data(question, "topics", mode="list")
    qtypes = await gdb.get_relationship_data(question, "qtypes", mode="list")
    return {"topics": topics, "qtypes": qtypes}  # type: ignore


async def get_question_data(session: Session, qid) -> QuestionData:
    question_id = convert_uuid(qid)
    question = session.exec(select(Question).where(Question.id == question_id)).first()
    if not question:
        raise ValueError("Failed to retrieve question, question does not exist in DB")

    question_data = question.model_dump(exclude=set(METADATA_REL))
    relationship_data = await get_question_relationship_data(question)
    return QuestionData(**question_data, **relationship_data)  # type: ignore


async def filter_questions(
    session: Session,
    data: QuestionData,
) -> Sequence[QuestionData]:
    filters = []
    stmt = select(Question)

    for key, values in data.model_dump(exclude=set(METADATA_REL)).items():
        if not values:
            continue

        if isinstance(values, list):
            filters.append(
                or_(*[gdb.filter_conditional(Question, key, v) for v in values])
            )
        else:
            filters.append(gdb.filter_conditional(Question, key, values))

    for key in METADATA_REL:
        values = getattr(data, key, None)
        if not values:
            continue

        rel_model, lookup_name = RELATIONSHIP_MAP[key]
        rel_conds = [
            gdb.filter_conditional(rel_model, lookup_name, value) for value in values
        ]
        filters.append(or_(*rel_conds))

    if filters:
        stmt = stmt.where(*filters)

    stmt = stmt.distinct()
    results = session.exec(stmt).all()
    return await asyncio.gather(
        *[get_question_data(session, result.id) for result in results]
    )
