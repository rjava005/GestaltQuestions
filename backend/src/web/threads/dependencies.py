from src.web.dependencies import SessionDep
from src.data.thread import ThreadDB, MessageDB
from src.core.logging import logger
from typing import Annotated
from fastapi import Depends


def get_thread_db(session: SessionDep) -> ThreadDB:
    try:
        logger.debug("Initialized Thread DB")
        return ThreadDB(session)
    except Exception:
        raise ValueError("Failed to initialize Thread DB")


ThreadDBDependency = Annotated[ThreadDB, Depends(get_thread_db)]

def get_message_db(session: SessionDep) -> MessageDB:
    try:
        logger.debug("Initialized Message DB")
        return MessageDB(session)
    except Exception:
        raise ValueError("Failed to initialize Message DB")

MessageDBDependency = Annotated[MessageDB, Depends(get_message_db)]
