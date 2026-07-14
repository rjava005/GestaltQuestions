from datetime import datetime
from typing import Any
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, select
from starlette import status

from backend.chat.model import Message, Thread
from backend.core import logger
from backend.utils import convert_uuid


class ThreadDB:
    def __init__(self, session: Session) -> None:
        self.session = session

    async def create_thread(self, user_id: UUID | str, thread_id: UUID | str) -> Thread:
        try:
            thread_orm = Thread(
                id=convert_uuid(thread_id),
                user_id=convert_uuid(user_id),
                # created_at/updated_at handled automatically
            )
            self.session.add(thread_orm)
            self.session.commit()
            self.session.flush()
            return thread_orm
        except SQLAlchemyError as e:
            self.session.rollback()
            message = f"[ThreadDB] failed to create thread {e}"
            logger.error(message)
            raise ValueError(message) from e

    async def get_thread(self, id: UUID) -> Thread:
        try:
            thread = self.session.exec(
                select(Thread).where(Thread.id == convert_uuid(id))
            ).first()
            if not thread:
                raise ValueError(f"Could not retrieve thread, Thread {id} is None")
            return thread
        except SQLAlchemyError as e:
            self.session.rollback()
            message = f"[ThreadDB] failed to get thread {e}"
            logger.error(message)
            raise ValueError(message) from e

    async def get_thread_for_user(
        self, user_id: UUID | str, thread_id: UUID | str
    ) -> Thread:
        try:
            stmt = select(Thread).where(
                Thread.id == convert_uuid(thread_id),
                Thread.user_id == convert_uuid(user_id),
            )
            thread = self.session.exec(stmt).first()
            if not thread:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Thread not found",
                )
            return thread
        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.session.rollback()
            message = f"[ThreadDB] failed to get user thread {e}"
            logger.error(message)
            raise ValueError(message) from e

    async def list_threads_for_user(
        self,
        user_id: UUID | str,
    ) -> list[Thread]:
        try:
            stmt = select(Thread).where(Thread.user_id == convert_uuid(user_id))
            stmt = stmt.order_by(Thread.updated_at.desc())  # type: ignore
            return list(self.session.exec(stmt).all())
        except SQLAlchemyError as e:
            self.session.rollback()
            message = f"[ThreadDB] failed to list threads {e}"
            logger.error(message)
            raise ValueError(message) from e

    async def touch_updated_at(self, id: UUID | str) -> Thread:
        """Bump updated_at so this thread sorts as 'most recent'."""
        # Used for when a thread is accessed, so it shows up as most recent in the UI. We want threads to sort by last used time, not creation time.
        try:
            thread = await self.get_thread(convert_uuid(id))
            thread.updated_at = datetime.now()
            self.session.add(thread)
            self.session.commit()
            self.session.flush()
            return thread
        except SQLAlchemyError as e:
            self.session.rollback()
            message = f"[ThreadDB] failed to update thread timestamp {e}"
            logger.error(message)
            raise ValueError(message) from e


class MessageDB:
    def __init__(self, session: Session) -> None:
        self.session = session

    async def create_message(
        self,
        thread_id: UUID | str,
        role: str,
        content: list[dict[str, Any]],
    ) -> Message:
        try:
            msg_orm = Message(
                thread_id=convert_uuid(thread_id),
                role=role,
                content=content,
                # created_at handled automatically
            )
            self.session.add(msg_orm)
            self.session.commit()
            self.session.flush()
            return msg_orm
        except SQLAlchemyError as e:
            self.session.rollback()
            message = f"[MessageDB] failed to create message {e}"
            logger.error(message)
            raise ValueError(message) from e

    async def get_message(self, id: UUID) -> Message:
        try:
            msg = self.session.exec(select(Message).where(Message.id == id)).first()
            if not msg:
                raise ValueError(f"Could not retrieve message, Message {id} is None")
            return msg
        except SQLAlchemyError as e:
            self.session.rollback()
            message = f"[MessageDB] failed to get message {e}"
            logger.error(message)
            raise ValueError(message) from e

    async def list_messages(self, thread_id: UUID) -> list[Message]:
        try:
            stmt = (
                select(Message)
                .where(Message.thread_id == thread_id)
                .order_by(Message.created_at.asc())  # type: ignore
            )
            return list(self.session.exec(stmt).all())
        except SQLAlchemyError as e:
            self.session.rollback()
            message = f"[MessageDB] failed to list messages {e}"
            logger.error(message)
            raise ValueError(message) from e

    async def list_messages_for_thread_for_user(
        self, thread_id: UUID | str, user_id: UUID | str
    ) -> list[Message]:
        try:
            stmt = (
                select(Message)
                .join(Thread, Message.thread_id == Thread.id)  # type: ignore
                .where(
                    Message.thread_id == convert_uuid(thread_id),
                    Thread.user_id == convert_uuid(user_id),
                )
                .order_by(Message.created_at.asc())  # type: ignore
            )
            return list(self.session.exec(stmt).all())
        except SQLAlchemyError as e:
            self.session.rollback()
            message = f"[MessageDB] failed to list user thread messages {e}"
            logger.error(message)
            raise ValueError(message) from e
