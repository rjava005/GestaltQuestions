# ruff: noqa: ANN001, ANN201, ANN204, ARG002

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from backend.question import QuestionRead, Status
from backend.question.models import Question
from backend.question_runtime.model import RuntimeLanguage
from backend.question_runtime.service.instance_db import QuestionInstanceDB
from backend.question_runtime.service.question_runtime import QuestionRunTimeService
from backend.storage import FileData


class FakeQuestionManager:
    def __init__(self, qid):
        self.question = QuestionRead(
            id=qid,
            title="Secure signals demo",
            storage_type="local",
            status=Status.PUBLISHED,
            ai_generated=False,
            isAdaptive=True,
        )

    async def get_question(self, _qid, method="full"):
        return self.question

    async def get_question_filedata(self, _qid):
        return [
            FileData(filename="question.html", content="<p>Find the gain.</p>"),
            FileData(filename="solution.html", content="<p>The gain is 2.</p>"),
            FileData(filename="server.py", content="def generate(): return {}"),
        ]


class FakeRuntimeDB:
    async def get_default(self, _qid):
        return SimpleNamespace(
            entry="server.py", language=RuntimeLanguage.PYTHON, func_name="generate"
        )


class FakeSandbox:
    def __init__(self):
        self.private_data = None

    async def execute(self, _payload):
        return {
            "output": {
                "secure_grading": True,
                "gain": 2,
                "answer_specs": {
                    "gain": {"type": "numeric", "absolute_tolerance": 0.01}
                },
                "correct_answers": {"gain": 2},
            },
            "logs": [],
        }

    async def grade(self, *, answers, private_data):
        self.private_data = private_data
        return {
            "overall": "correct",
            "slots": {"gain": {"status": "correct"}},
        }


@pytest.mark.asyncio
async def test_secure_run_keeps_answers_and_solution_private(db_session):
    question = Question(title="Secure signals demo", isAdaptive=True)
    db_session.add(question)
    db_session.commit()
    db_session.refresh(question)
    qid = question.id
    instance_db = QuestionInstanceDB(db_session)
    sandbox = FakeSandbox()
    service = QuestionRunTimeService(
        FakeQuestionManager(qid), FakeRuntimeDB(), sandbox, instance_db
    )
    service._sync.sync_from_files = AsyncMock(return_value=[])

    bundle = await service.run(qid, None)

    assert bundle.solution_html is None
    assert bundle.quiz_data["answer_specs"]["gain"]["type"] == "numeric"
    assert "correct_answers" not in bundle.quiz_data
    stored = await instance_db.get(bundle.instance)
    assert stored.private_grading_data["correct_answers"] == {"gain": 2}

    result = await service.grade(qid, bundle.instance, {"gain": 2})

    assert result["status"] == "correct"
    assert result["answers"] == {"gain": {"status": "correct"}}
    assert result["solution_html"] == "<p>The gain is 2.</p>"
    assert sandbox.private_data["correct_answers"] == {"gain": 2}
    assert "solution_html" not in sandbox.private_data


@pytest.mark.asyncio
async def test_expired_instance_is_deleted_and_returns_gone(db_session):
    question = Question(title="Expired signals demo", isAdaptive=True)
    db_session.add(question)
    db_session.commit()
    db_session.refresh(question)
    qid = question.id
    instance_db = QuestionInstanceDB(db_session)
    instance = await instance_db.create(
        qid,
        {"answer_specs": {}, "correct_answers": {}},
        lifetime=timedelta(seconds=-1),
    )
    service = QuestionRunTimeService(
        FakeQuestionManager(qid), FakeRuntimeDB(), FakeSandbox(), instance_db
    )

    with pytest.raises(HTTPException) as exc_info:
        await service.grade(qid, instance.id, {})

    assert exc_info.value.status_code == 410
    assert await instance_db.get(instance.id) is None


@pytest.mark.asyncio
async def test_lazy_cleanup_removes_only_expired_instances(db_session):
    question = Question(title="Cleanup signals demo", isAdaptive=True)
    db_session.add(question)
    db_session.commit()
    db_session.refresh(question)
    instance_db = QuestionInstanceDB(db_session)
    expired = await instance_db.create(question.id, {}, lifetime=timedelta(seconds=-1))
    current = await instance_db.create(question.id, {})

    removed = await instance_db.cleanup_expired(now=datetime.now(UTC))

    assert removed == 1
    assert await instance_db.get(expired.id) is None
    assert await instance_db.get(current.id) is not None


@pytest.mark.asyncio
async def test_cleanup_does_not_compare_loaded_aware_instances(db_session):
    question = Question(title="Loaded cleanup demo", isAdaptive=True)
    db_session.add(question)
    db_session.commit()
    db_session.refresh(question)
    instance_db = QuestionInstanceDB(db_session)
    current = await instance_db.create(question.id, {})
    current.expires_at = datetime.now(UTC) + timedelta(hours=1)

    removed = await instance_db.cleanup_expired(now=datetime.now(UTC))

    assert removed == 0
    assert await instance_db.get(current.id) is not None
