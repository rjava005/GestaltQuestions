from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import httpx
from fastapi.routing import APIRouter

router = APIRouter(prefix="/agents", tags=["ai"])

LANGGRAPH_STREAM_URL = "http://host.docker.internal:2024/runs/stream"


@router.get("/proxy-stream")
async def proxy_stream():

    async def generator():
        full_data = ""
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                LANGGRAPH_STREAM_URL,
                json={
                    "assistant_id": "agent_me135",
                    "input": {
                        "messages": [
                            {
                                "role": "user",
                                "content": "generate a simple test question",
                            }
                        ]
                    },
                },
            ) as r:
                async for line in r.aiter_lines():
                    if line:
                        if line.startswith("data:"):
                            full_data += line[5:]
                        yield line + "\n"
        print("FINAL OUTPUT:", full_data)

    return StreamingResponse(generator(), media_type="text/event-stream")
