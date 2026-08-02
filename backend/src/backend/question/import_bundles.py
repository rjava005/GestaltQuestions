"""Import local question bundles into the development database."""

import asyncio
import json
from pathlib import Path
from uuid import UUID, uuid5

from sqlmodel import Session, select

from backend.auth import InstitutionDB, RoleDB
from backend.auth.model import DeveloperProfile, Institution, Role, User
from backend.auth.schemas import UserRoles, ValidInstitutions
from backend.chat import model as chat_models  # noqa: F401
from backend.core.config import ROOT_PATH
from backend.database import engine
from backend.question.models import Question
from backend.question.schema import QType, QuestionCreate, QuestionUpdate, Status
from backend.question.services.qtype import QuestionQTypeDB
from backend.question.services.question import QuestionDB
from backend.question_runtime.model import RuntimeConfigSource, RuntimeLanguage
from backend.question_runtime.schema import QuestionRuntimeCreate
from backend.question_runtime.service.runtime_db import QuestionRuntimeDB

DEFAULT_BUNDLES = (
    "EE30B_CH1_Q1",
    "EE30B_CH1_Q2",
    "EE_CH2_Q1",
    "EE_CH2_Q2",
    "framework_signal_demo",
    "framework_feedback_demo",
)
IMPORT_NAMESPACE = UUID("bd844591-cc55-4db4-8670-31269c8ffcff")
IMPORT_USER_ID = uuid5(IMPORT_NAMESPACE, "ee30b-import-user")
IMPORT_PROFILE_ID = uuid5(IMPORT_NAMESPACE, "ee30b-import-profile")
IMPORT_EMAIL = "ee30b-import@localhost"


def _load_metadata(bundle_dir: Path) -> dict:
    metadata_path = bundle_dir / "info.json"
    if not metadata_path.is_file():
        raise FileNotFoundError(f"Missing metadata file: {metadata_path}")

    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    if not metadata.get("title"):
        raise ValueError(f"Question metadata has no title: {metadata_path}")
    if not (bundle_dir / "question.html").is_file():
        raise FileNotFoundError(f"Missing question.html in {bundle_dir}")
    return metadata


async def _get_import_owner(session: Session) -> DeveloperProfile:
    await InstitutionDB(session).seed_institution()
    await RoleDB(session).seed_roles()

    institution = session.exec(
        select(Institution).where(Institution.name == ValidInstitutions.UCR)
    ).first()
    developer_role = session.exec(
        select(Role).where(Role.name == UserRoles.DEVELOPER.value)
    ).first()
    if institution is None or developer_role is None:
        raise RuntimeError("Failed to seed import owner relationships")

    user = session.exec(select(User).where(User.email == IMPORT_EMAIL)).first()
    if user is None:
        user = User(
            id=IMPORT_USER_ID,
            first_name="EE30B",
            last_name="Importer",
            username="ee30b-importer",
            email=IMPORT_EMAIL,
            institution_id=institution.id,
            roles=[developer_role],
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    else:
        user.institution_id = institution.id
        if developer_role not in user.roles:
            user.roles.append(developer_role)
        session.add(user)
        session.commit()

    profile = session.exec(
        select(DeveloperProfile).where(DeveloperProfile.user_id == user.id)
    ).first()
    if profile is None:
        profile = DeveloperProfile(
            id=IMPORT_PROFILE_ID,
            user_id=user.id,
            storage_path="questions",
        )
        session.add(profile)
        session.commit()
        session.refresh(profile)
    return profile


async def _sync_runtimes(
    session: Session, question_id: UUID, bundle_dir: Path
) -> list[str]:
    runtime_db = QuestionRuntimeDB(session)
    configured: list[str] = []

    has_javascript = (bundle_dir / "server.js").is_file()
    runtime_files = (
        ("server.js", RuntimeLanguage.JAVASCRIPT, True),
        ("server.py", RuntimeLanguage.PYTHON, not has_javascript),
    )
    for filename, language, is_default in runtime_files:
        if not (bundle_dir / filename).is_file():
            continue
        await runtime_db.upsert(
            question_id,
            QuestionRuntimeCreate(
                language=language,
                entry=filename,
                func_name="generate",
                source=RuntimeConfigSource.INFERRED,
                is_default=is_default,
                enabled=True,
            ),
        )
        configured.append(language.value)
    return configured


async def import_bundles(
    question_root: Path = ROOT_PATH / "questions",
    bundle_names: tuple[str, ...] = DEFAULT_BUNDLES,
) -> list[dict[str, object]]:
    results: list[dict[str, object]] = []

    with Session(engine, expire_on_commit=False) as session:
        owner = await _get_import_owner(session)
        QuestionQTypeDB(session).seed_types()
        question_db = QuestionDB(session)

        for bundle_name in bundle_names:
            bundle_dir = question_root / bundle_name
            metadata = _load_metadata(bundle_dir)
            title = str(metadata["title"])
            topics = [str(topic) for topic in metadata.get("topics", [])]

            question = session.exec(
                select(Question).where(
                    Question.title == title,
                    Question.created_by_id == owner.id,
                )
            ).first()
            created = question is None
            if question is None:
                question = await question_db.create_question(
                    QuestionCreate(
                        title=title,
                        topics=topics,
                        qType=[QType.NUM],
                        isAdaptive=bool(metadata.get("isAdaptive", False)),
                        ai_generated=bool(metadata.get("ai_generated", False)),
                    )
                )
            else:
                await question_db.update_question(
                    question.id,
                    QuestionUpdate(
                        topics=topics,
                        qType=[QType.NUM.value],
                        isAdaptive=bool(metadata.get("isAdaptive", False)),
                        ai_generated=bool(metadata.get("ai_generated", False)),
                    ),
                )
                question = await question_db.get_question(question.id)
                if question is None:
                    raise RuntimeError(f"Question disappeared during import: {title}")

            question.created_by_id = owner.id
            question.storage_type = "local"
            question.storage_path = f"questions/{bundle_name}/"
            question.status = Status.PUBLISHED
            session.add(question)
            session.commit()
            session.refresh(question)

            if question.id is None:
                raise RuntimeError(f"Imported question has no ID: {title}")
            runtimes = await _sync_runtimes(session, question.id, bundle_dir)
            results.append(
                {
                    "bundle": bundle_name,
                    "id": str(question.id),
                    "title": title,
                    "created": created,
                    "runtimes": runtimes,
                }
            )

    return results


if __name__ == "__main__":
    imported = asyncio.run(import_bundles())
    print(json.dumps(imported, indent=2))
