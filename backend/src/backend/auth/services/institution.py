from typing import overload

from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, select

from backend.auth.exceptions import (
    InstitutionCreateError,
    InstitutionReadError,
    InstitutionSeedError,
    InstitutionValidationError,
)
from backend.auth.model import Institution
from backend.auth.schemas import ValidInstitutions
from backend.core import logger
from backend.shared.schema import ID
from backend.utils import convert_uuid


class InstitutionDB:
    def __init__(self, session: Session) -> None:
        self.session = session

    async def create_institution(
        self,
        institution: ValidInstitutions,
        description: str | None = "",
    ) -> Institution:
        try:
            inst = Institution(
                name=institution,
                description=description,
            )
            self.session.add(inst)
            self.session.commit()
            self.session.refresh(inst)
            logger.debug("[DB] Institution created successfully")
            return inst

        except SQLAlchemyError as e:
            self.session.rollback()
            logger.error(f"[DB] Failed to create institution: {e}")
            raise InstitutionCreateError(details=str(e)) from e

    # ---------- OVERLOADS (type checking only) ----------
    @overload
    async def get_institution(self, identifier: ID) -> Institution | None: ...

    @overload
    async def get_institution(
        self,
        identifier: ValidInstitutions,
    ) -> Institution | None: ...

    # ---------- REAL IMPLEMENTATION ----------
    async def get_institution(
        self,
        identifier: ID | ValidInstitutions,
    ) -> Institution | None:
        try:
            if isinstance(identifier, ValidInstitutions):
                return self.session.exec(
                    select(Institution).where(Institution.name == identifier.name)
                ).first()
            if not identifier:
                raise InstitutionValidationError(
                    "Institution identifier cannot be None"
                )
            institution_id = convert_uuid(identifier)
            return self.session.exec(
                select(Institution).where(Institution.id == institution_id)
            ).first()

        except SQLAlchemyError as e:
            logger.error(f"[DB] Could not get institution: {e}")
            raise InstitutionReadError(details=str(e)) from e
        except InstitutionValidationError:
            raise
        except ValueError as e:
            raise InstitutionValidationError(details=str(e)) from e

    async def seed_institution(self) -> None:
        institutions: dict[ValidInstitutions, str] = {
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
            for institution, desc in institutions.items():
                if not await self.get_institution(institution):
                    await self.create_institution(institution, desc)
        except Exception as e:
            raise InstitutionSeedError(details=str(e)) from e

    async def get_all_institutions(self):
        try:
            return self.session.exec(select(Institution)).all()
        except SQLAlchemyError as e:
            logger.error(f"[DB] Could not get institutions: {e}")
            raise InstitutionReadError(details=str(e)) from e
