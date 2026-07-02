"""Dynamic agent configured with runtime model routing."""

from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from langchain.agents.middleware import HumanInTheLoopMiddleware, InterruptOnConfig
from langchain.tools import tool
from src.agent.core.context import (
    GeminiModel,
    ModelProvider,
    ConfigSchema,
    ModelRoutingMiddleware,
)
from typing import Dict, Any, Optional
from datetime import datetime

model = init_chat_model(
    model_provider=ModelProvider.GEMINI.value,
    model=GeminiModel.GEMINI_2_5_FLASH.value,
)

_mock_database = []


@tool
def write_to_database(query: str) -> Dict[str, Any]:
    """
    Mock database write tool.

    Use this when the agent needs to simulate saving data to a database.
    The input should be a SQL INSERT, UPDATE, or DELETE statement.
    """
    normalized = query.strip().lower()

    if not normalized.startswith(("insert", "update", "delete")):
        return {
            "success": False,
            "error": "Only INSERT, UPDATE, and DELETE statements are allowed.",
            "query": query,
        }

    record = {
        "id": len(_mock_database) + 1,
        "query": query,
        "written_at": datetime.utcnow().isoformat(),
    }

    _mock_database.append(record)

    return {
        "success": True,
        "message": "Mock database write completed.",
        "record": record,
    }


@tool
def get_database_records(limit: Optional[int] = None) -> Dict[str, Any]:
    """
    Mock database read tool.

    Use this when the agent needs to retrieve records that were previously
    written to the mock database.
    """

    records = _mock_database if limit is None else _mock_database[:limit]

    return {
        "success": True,
        "count": len(records),
        "records": records,
    }


agent = create_agent(
    model=model,
    system_prompt="You are a helpful assistant. You have access to a database where you can add or retrieve records",
    middleware=[
        ModelRoutingMiddleware(),  # type: ignore
        HumanInTheLoopMiddleware(
            interrupt_on={
                "write_to_database": {
                    "allowed_decisions": ["approve", "reject", "edit"]
                },  # No editing allowed
            },
            description_prefix="Tool execution pending approval",
        ),
    ],  # type: ignore
    context_schema=ConfigSchema,
    tools=[write_to_database, get_database_records],
)  # type: ignore
