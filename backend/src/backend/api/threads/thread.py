from typing import Any
from uuid import UUID

from dotenv import load_dotenv
from fastapi.exceptions import HTTPException
from fastapi.routing import APIRouter
from langgraph_sdk import get_client
from starlette import status

from backend.api.deps import CurrentUser, MessageDBDependency, ThreadDBDependency
from backend.chat.model import Message, Thread
from backend.chat.schema import MessageCreate
from backend.core import get_settings

load_dotenv()
router = APIRouter(prefix="/threads", tags=["threads"])

settings = get_settings()
client = get_client(
    url=settings.LANGGRAPH_STREAM_URL, api_key=settings.LANGSMITH_API_KEY
)


@router.post("/{thread_id}", response_model=Thread)
async def create_thread(
    thread_id: str | UUID,
    tdb: ThreadDBDependency,
    user: CurrentUser,
) -> Thread:
    return await tdb.create_thread(
        user_id=user,
        thread_id=thread_id,
    )


@router.get("/", response_model=list[Thread])
async def list_my_threads(
    tdb: ThreadDBDependency,
    user: CurrentUser,
) -> list[Thread]:
    return await tdb.list_threads_for_user(user_id=user)


@router.get("/{thread_id}")
async def get_thread(
    thread_id: str | UUID,
    tdb: ThreadDBDependency,
    user: CurrentUser,
):
    await tdb.get_thread_for_user(user_id=user, thread_id=thread_id)

    try:
        data = await client.threads.get(str(thread_id))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to retrieve thread data from stream service: {e}",
        ) from e

    values = data.get("values", {}) if isinstance(data, dict) else {}
    messages = values.get("messages", [])
    return messages if isinstance(messages, list) else []


@router.get("/{thread_id}/details")
async def get_user_thread_details(
    thread_id: str | UUID,
    tdb: ThreadDBDependency,
    mdb: MessageDBDependency,
    user: CurrentUser,
):
    thread = await tdb.get_thread_for_user(user_id=user, thread_id=thread_id)
    db_messages = await mdb.list_messages_for_thread_for_user(
        thread_id=thread_id,
        user_id=user,
    )

    langgraph_messages: list[Any] = []
    try:
        data = await client.threads.get(str(thread_id))
        values = data.get("values", {}) if isinstance(data, dict) else {}
        messages = values.get("messages", [])  # type: ignore
        if isinstance(messages, list):
            langgraph_messages = messages
    except Exception:
        langgraph_messages = []

    return {
        "thread": thread,
        "db_messages": db_messages,
        "langgraph_messages": langgraph_messages,
    }


@router.post("/{thread_id}/messages", response_model=list[Message])
async def create_message(
    thread_id: UUID | str,
    data: list[MessageCreate],
    mdb: MessageDBDependency,
    tdb: ThreadDBDependency,
) -> list[Message]:
    try:
        created_messages = []
        for m in data:
            msg = await mdb.create_message(
                thread_id=thread_id,
                role=m.role,
                content=m.content,
            )
            await tdb.touch_updated_at(thread_id)
            created_messages.append(msg)
        return created_messages
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create the message {e}",
        ) from e


# @router.get("/", response_model=list[Thread])
# async def list_threads(
#     data: ThreadList,
#     tdb: ThreadDBDependency,
#     user: StudentDep,
# ) -> list[Thread]:
#     return await tdb.list_threads_for_user(
#         user_id=data.user_id,
#         course_id=data.course_id,
#     )


# @router.get("/{thread_id}", response_model=Thread)
# async def get_thread(
#     thread_id: UUID | str,
#     tdb: ThreadDBDependency,
#     user: StudentDep,
# ) -> Thread:
#     return await tdb.get_thread(thread_id)


# @router.get("/{thread_id}/messages", response_model=list[Message])
# async def list_messages(
#     thread_id: UUID,
#     mdb: MessageDBDependency,
#     user: StudentDep,
# ) -> list[Message]:
#     return await mdb.list_messages(thread_id)
