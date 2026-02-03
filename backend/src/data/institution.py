from typing import Annotated, Dict, Union, overload

from fastapi import Depends
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import select

from src.core import SessionDep, logger
from src.utils import convert_uuid


from src.model.institution import Institution
from src.types import STORAGE_TYPE, ID, ValidInstitutions

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


class InstitutionDB:
    def __init__(self, session: SessionDep):
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
            raise

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
        identifier: Union[ID, ValidInstitutions],
    ) -> Institution | None:
        try:
            if isinstance(identifier, ValidInstitutions):
                return self.session.exec(
                    select(Institution).where(Institution.name == identifier.name)
                ).first()
            if not identifier:
                raise ValueError("[DB] Identifier cannot be None")
            institution_id = convert_uuid(identifier)
            return self.session.exec(
                select(Institution).where(Institution.id == institution_id)
            ).first()

        except SQLAlchemyError as e:
            logger.error(f"[DB] Could not get institution: {e}")
            raise

    async def seed_institution(self):
        for institution, desc in institutions.items():
            if not await self.get_institution(institution):
                await self.create_institution(institution, desc)


def get_institution_database(session: SessionDep) -> InstitutionDB:
    return InstitutionDB(session)


InstitutionDependency = Annotated[InstitutionDB, Depends(get_institution_database)]
