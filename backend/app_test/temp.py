# @pytest.mark.asyncio
# async def test_set_user_question(make_user, make_question, user_db):
#     qcreated = await make_question()
#     user = await make_user()
#     await user_db.set_user_created_questions(user.id, qcreated)
#     result = user_db.get_user_created_questions(user.id)
#     assert result


# @pytest.mark.asyncio
# async def test_set_user_questions(make_user, make_question, user_db):
#     user = await make_user()
#     for _ in range(3):
#         qcreated = await make_question()
#         await user_db.set_user_created_questions(user.id, qcreated)
#     result = user_db.get_user_created_questions(user.id)

#     logger.debug(f"These are the results {result}")
#     assert result
#     assert len(result) == 3


# @pytest.mark.parametrize(
#     "institution",
#     [ValidInstitutions.CPP, ValidInstitutions.NORCO, ValidInstitutions.UCR, None],
# )
# @pytest.mark.parametrize(
#     "role", [UserRoles.ADMIN, UserRoles.DEVELOPER, UserRoles.STUDENT, UserRoles.TEACHER]
# )
# @pytest.mark.parametrize("user_data", USERS)
# def test_make_user_full(institution, role, user_data, db_session):
#     # Create the institution and role
#     if institution:
#         inst = instituion_db.create_institution(db_session, institution)
#         assert inst
#     r = role_db.create_role(db_session, role, "")

#     assert r
#     user = user_db.create_user_full(user_data, db_session, role, institution)
#     assert user
#     if institution:
#         assert user.institution.name == institution.value  # type: ignore
#     assert user.role.name == role.value
