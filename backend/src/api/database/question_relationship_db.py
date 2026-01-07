from src.api.core.database import SessionDep
from src.api.database.models.question import Language, QuestionType, Topic
from src.api.database.generic import create_or_resolve


def create_qtype(name: str, session: SessionDep) -> QuestionType:
    return create_or_resolve(QuestionType, name, session)[0]


def create_qtopic(name: str, session: SessionDep) -> Topic:
    return create_or_resolve(Topic, name, session)[0]


def create_language(name: str, session: SessionDep) -> Language:
    return create_or_resolve(Language, name, session)[0]
