from fastapi.responses import StreamingResponse
from fastapi.routing import APIRouter
from langgraph_sdk import get_client
import json
from fastapi import Request
from pydantic import BaseModel
from typing import List, Literal

router = APIRouter(prefix="/agents", tags=["ai"])

LANGGRAPH_STREAM_URL = "http://host.docker.internal:2024"
client = get_client(url=LANGGRAPH_STREAM_URL)


class BaseMessage(BaseModel):
    role: Literal["human", "user", "system", "ai"]
    content: str


class ChatRequest(BaseModel):
    messages: List[BaseMessage] = []
    thread_id: str | None = None


@router.post("/chat")
async def chat_endpoint(request: Request, input_data: ChatRequest):

    # Extract
    messages = input_data.messages
    thread_id = input_data.thread_id

    if not thread_id:
        thread = await client.threads.create()
        thread_id = thread["thread_id"]

    # 2. Define the generator to stream events from the remote deployment
    async def event_generator():
        # send initial metadata for frontend state

        try:
            async for event in client.runs.stream(
                thread_id=thread_id,
                assistant_id="agent_gestalt",
                input={"messages": messages},  # type: ignore
                stream_mode="events",
            ):  # type: ignore
                payload = {
                    "data": event.data,
                }
                yield f"data: {json.dumps(payload)}\n\n"
        except Exception as e:
            err = {"type": "error", "data": {"message": str(e)}}
            yield f"data: {json.dumps(err)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # helpful behind nginx
        },
    )
