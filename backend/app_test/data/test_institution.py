import pytest
from app_test.shared.factories import make_user
from src.core import logger
from src.types import (
    ValidInstitutions,
)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "institution",
    [ValidInstitutions.CPP, ValidInstitutions.NORCO, ValidInstitutions.UCR],
)
async def test_set_user_institution(make_user, institution_db, institution, user_db):
    inst = await institution_db.create_institution(institution)
    logger.info("This is the created inst %s", inst)
    assert inst
    user = await make_user()
    user = await user_db.set_user_institution(
        user.id,
        institution,
    )
    assert user
    assert user.institution.name == institution.value
    assert user.institution_id == inst.id
