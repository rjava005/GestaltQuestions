import pytest
from backend.auth import InstitutionDB, InstitutionValidationError, ValidInstitutions


@pytest.fixture
def institution_db(db_session) -> InstitutionDB:
    return InstitutionDB(db_session)


@pytest.mark.parametrize(
    "institution",
    [ValidInstitutions.CPP, ValidInstitutions.NORCO, ValidInstitutions.UCR],
)
@pytest.mark.asyncio
async def test_create_institution(institution_db, institution) -> None:
    inst = await institution_db.create_institution(institution)

    assert inst.id is not None
    assert inst.name == institution
    assert inst.description == ""


@pytest.mark.asyncio
async def test_get_institution_by_id(institution_db) -> None:
    created = await institution_db.create_institution(ValidInstitutions.CPP)

    found = await institution_db.get_institution(created.id)

    assert found is not None
    assert found.id == created.id
    assert found.name == ValidInstitutions.CPP


@pytest.mark.asyncio
async def test_get_institution_with_none_identifier_raises_validation_error(
    institution_db,
) -> None:
    with pytest.raises(
        InstitutionValidationError,
        match="Institution identifier cannot be None",
    ):
        await institution_db.get_institution(None)


@pytest.mark.asyncio
async def test_seed_institution_creates_all_once(institution_db) -> None:
    await institution_db.seed_institution()
    # Hard coded 3
    assert len(await institution_db.get_all_institutions()) == 3
