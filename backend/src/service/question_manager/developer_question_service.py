from dataclasses import dataclass
from typing import Any, List, Optional, Sequence, Literal, Dict
import asyncio
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, select
from src.app_types.general import ID
from src.core.logging import logger
from src.model.files import FileData
from src.model.question import Question, QuestionCreate, QuestionUpdate
from src.service.user.exceptions import DeveloperAccessDenied, DeveloperProfileError
from src.utils.database_utils import convert_uuid
from src.model.question import QuestionRead
from .exceptions import (
    DeveloperQuestionControlError,
    DeveloperQuestionServiceError,
    QuestionNotFoundError,
)
from .question_manager import QuestionManager
from src.service.user.developer_access import (
    DeveloperAccessService,
)
import json
from sqlmodel import select
from src.model.question import Question


@dataclass
class AccessDecision:
    allowed: bool
    reason: str


class DeveloperQuestionService:
    """Gate developer question actions and coordinate developer-owned question data."""

    def __init__(
        self,
        session: Session,
        developer_access: DeveloperAccessService,
        question_manager: QuestionManager,
    ):

        self.developer_access = developer_access
        self.session = session
        self.qmng = question_manager

    # ------------------------------------------------------------------

    async def has_question_control(self, user_id: ID, qid: ID) -> AccessDecision:
        """Return whether the developer profile has control over a question."""
        logger.debug(
            "Checking question control for user %s on question %s", user_id, qid
        )
        profile = await self.developer_access.get_developer_data(user_id)
        if not profile:
            raise DeveloperProfileError("retrieve", str(user_id), "Profile not set")
        try:
            stmt = select(Question).where(
                Question.created_by_id == convert_uuid(profile.id)
            )
            q = self.session.exec(stmt).first()
            if q is None:
                logger.warning(
                    "Question control denied for user %s on question %s", user_id, qid
                )
                return AccessDecision(
                    allowed=False,
                    reason="User does not have access to modify the question",
                )
            return AccessDecision(allowed=True, reason="User has control")
        except SQLAlchemyError as e:
            logger.warning(
                "Database error checking question control for user %s on question %s",
                user_id,
                qid,
            )
            raise DeveloperQuestionControlError(str(user_id), str(qid), str(e)) from e

    async def require_question_control(self, user_id: ID, qid: ID) -> None:
        """Raise when the user does not control the requested question."""
        access = await self.has_question_control(user_id, qid)
        if not access.allowed:
            raise DeveloperAccessDenied(
                access.reason, user_id=str(user_id), question_id=str(qid)
            )

    # ------------------------------------------------------------------
    # Question Lifecycle
    # ------------------------------------------------------------------

    async def create_question(
        self,
        user_id: ID,
        payload: QuestionCreate,
        files: Optional[List[FileData]] = None,
    ) -> Question:
        """Create a question under the developer profile and assign ownership."""
        profile = await self.developer_access.get_developer_data(user_id)
        # TODO check this logic
        if profile is None or profile.storage_path is None:
            logger.info("Creating developer profile for user %s", user_id)
            profile = await self.developer_access.set_developer_data(user_id)

        if not profile.storage_path:
            raise DeveloperProfileError(
                "create question",
                str(user_id),
                f"Profile '{profile.id}' has no storage path",
            )
        question = await self.qmng.create_question(
            qdata=payload,
            storage_base_path=profile.storage_path,
            files=files,
        )
        try:
            logger.debug(
                "Assigning creator profile %s to question %s", profile.id, question.id
            )
            question.created_by = profile
            self.session.add(question)
            self.session.commit()
            self.session.refresh(question)
            return question
        except SQLAlchemyError as e:
            self.session.rollback()
            logger.warning("Failed assigning creator to question %s", question.id)
            raise DeveloperProfileError(
                "assign question creator", str(user_id), str(e)
            ) from e

    async def copy_question(self, qid: ID, user_id: ID):
        """Create a copy question under the developer profile and assign ownership."""
        profile = await self.developer_access.get_developer_data(user_id)
        if profile is None:
            logger.info("Creating developer profile for user %s", user_id)
            profile = await self.developer_access.set_developer_data(user_id)

        if not profile.storage_path:
            raise DeveloperProfileError(
                "create question",
                str(user_id),
                f"Profile '{profile.id}' has no storage path",
            )
        question = await self.qmng.copy_question(qid, profile.storage_path)
        try:
            logger.debug(
                "Assigning creator profile %s to question %s", profile.id, question.id
            )
            question.created_by = profile
            self.session.add(question)
            self.session.commit()
            self.session.refresh(question)
            return question
        except SQLAlchemyError as e:
            self.session.rollback()
            logger.warning("Failed assigning creator to question %s", question.id)
            raise DeveloperProfileError(
                "assign question creator", str(user_id), str(e)
            ) from e

    async def list_my_questions(
        self, user_id: ID, method: Literal["default", "full"] = "default"
    ) -> List[Question] | List[QuestionRead]:
        """List questions created by the developer profile for the user."""
        await self.developer_access.require_developer_access(user_id)
        try:
            user = await self.developer_access.get_developer_data(user_id)
            if not user:
                raise DeveloperProfileError(
                    "retrieve", str(user_id), "Profile not found"
                )
            logger.debug("Listing questions for developer user %s", user_id)
            if method == "default":
                return user.created_questions
            else:
                results = await asyncio.gather(
                    *(
                        self.qmng.qdb.get_question_data(q.id)
                        for q in user.created_questions
                    )
                )
                return results
        except DeveloperQuestionServiceError:
            raise
        except SQLAlchemyError as e:
            raise DeveloperProfileError("list questions", str(user_id), str(e)) from e

    async def get_question(
        self, user_id: ID, qid: ID, method: Literal["full", "simple"] = "simple"
    ) -> Question | QuestionRead:
        """Retrieve a question after checking developer question control."""
        await self.has_question_control(user_id, qid)
        if method == "full":
            q = await self.qmng.qdb.get_question_data(qid)
        else:
            q = await self.qmng.qdb.get_question(qid)
        if not q:
            raise QuestionNotFoundError(str(qid))
        return q

    async def update_question(self, user_id: ID, qid: ID, update: QuestionUpdate):
        """Update question metadata after checking developer question control."""
        await self.has_question_control(user_id, qid)
        return await self.qmng.update_question_meta(qid, update)

    async def delete_question(self, user_id: ID, qid: ID) -> bool:
        """Delete a question and its storage after checking developer question control."""
        await self.has_question_control(user_id, qid)
        return await self.qmng.delete_question(qid)

    # Filtering
    async def filter_questions(self, user_id: ID, title: str) -> Sequence[QuestionRead]:
        try:
            profile = await self.developer_access.get_developer_data(user_id)
            assert profile
            add_filter = Question.created_by_id == profile.id
            return await self.qmng.qdb.filter_questions(
                title, additional_filters=[add_filter]
            )
        except Exception as e:
            raise ValueError(f"Failed to filer question {e}")

    async def prepare_question_download(
        self, user_id: ID, qid: ID
    ) -> Dict[str, bytes | bytearray]:
        try:
            q = await self.get_question(user_id, qid)
            qfiles = await self.get_question_filedata(user_id, qid)
            file_payload: Dict[str, bytes | bytearray] = dict()
            for f in qfiles:
                content = f.content
                if isinstance(content, str):
                    content = content.encode()
                elif isinstance(content, dict):
                    content = (json.dumps(content)).encode()

                file_payload[f.filename] = content
            return file_payload

        except QuestionNotFoundError:
            raise
        except DeveloperAccessDenied:
            raise
        except Exception as e:
            raise ValueError(f"Failed to donwload Question {e}")

    # ------------------------------------------------------------------
    # Question Files
    # ------------------------------------------------------------------

    async def get_question_files(self, user_id: ID, qid: ID) -> Sequence[str]:
        """List stored files for a controlled question."""
        await self.has_question_control(user_id, qid)
        return await self.qmng.get_question_files(qid)

    async def get_question_filedata(self, user_id: ID, qid: ID) -> Sequence[FileData]:
        await self.has_question_control(user_id, qid)
        return await self.qmng.get_question_filedata(qid)

    async def read_file(self, user_id: ID, qid: ID, filename: str) -> bytes | None:
        """Read a stored question file after checking developer question control."""
        await self.has_question_control(user_id, qid)
        return await self.qmng.read_file(qid, filename)

    async def write_file(self, user_id: ID, qid: ID, filename: str, data: Any):
        """Write or replace a question file after checking developer question control."""
        await self.has_question_control(user_id, qid)
        return await self.qmng.write_file(qid, filename, data)

    async def delete_file(self, user_id: ID, qid: ID, filename: str):
        """Delete a question file after checking developer question control."""
        await self.has_question_control(user_id, qid)
        return await self.qmng.delete_file(qid, filename)

    async def upload_files(self, user_id: ID, qid: ID, files: List[FileData]):
        """Upload files to a question after checking developer question control."""
        await self.has_question_control(user_id, qid)
        return await self.qmng.upload_files(qid, files)
