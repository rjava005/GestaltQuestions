from typing import Dict

from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import select

from src.api.core import logger
from src.api.core.database import SessionDep
from src.api.models.models.institution import ValidInstitutions, Institution


def seed_institution(session: SessionDep):
    institutions: Dict[ValidInstitutions, str] = {
        ValidInstitutions.UCR: (
            "University of California, Riverside. A public research university "
            "focused on undergraduate and graduate education, research, and innovation."
        ),
        ValidInstitutions.CPP: (
            "California State Polytechnic University, Pomona. A hands-on, "
            "learn-by-doing institution with a strong emphasis on engineering, "
            "applied sciences, and professional practice."
        ),
        ValidInstitutions.NORCO: (
            "Norco College. A community college offering associate degrees, "
            "certificates, and transfer pathways, with a focus on accessible, "
            "career-oriented, and foundational education."
        ),
    }
    try:
        for i, desc in institutions.items():
            if not get_institution(i.value, session):
                create_institution(session, i, description=desc)
    except Exception:
        raise


def create_institution(
    session: SessionDep, institution: ValidInstitutions, description: str | None = ""
):
    try:
        inst = Institution(name=institution, description=description)
        session.add(inst)
        session.commit()
        session.refresh(inst)
        logger.debug("[DB] Role created successfully")
        return inst

    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"[DB] Failed to create role: {e}")
        return None


def get_institution(institution: str, session: SessionDep) -> Institution | None:
    return session.exec(
        select(Institution).where(Institution.name == institution)
    ).first()
