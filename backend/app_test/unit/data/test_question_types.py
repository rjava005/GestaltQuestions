import pytest
from backend.question import QType, QuestionQTypeDB
from backend.question.services.question import QuestionDB


@pytest.fixture
def question_db(db_session) -> QuestionDB:
    return QuestionDB(db_session)


@pytest.fixture
def qtype_db(db_session) -> QuestionQTypeDB:
    return QuestionQTypeDB(db_session)


@pytest.mark.parametrize("t", [QType.MC, QType.NUM, QType.FB])
def test_create_qtype(qtype_db, t) -> None:
    tc = qtype_db.create(t)
    assert tc.id is not None
    assert tc.name == t
    assert tc.description is None


@pytest.mark.parametrize("t", [QType.MC, QType.NUM, QType.FB])
def test_seed_roles(qtype_db, t) -> None:
    qtype_db.seed_types()
    tr = qtype_db.get_qtype(t)
    assert tr is not None
    assert tr.name == t


@pytest.mark.parametrize("t", [QType.MC, QType.NUM, QType.FB])
def test_get_type_by_id(qtype_db, t) -> None:
    created = qtype_db.create(t)

    found = qtype_db.get_qtype(created.id)
    assert found is not None
    assert found.id == created.id
    assert found.name == t
