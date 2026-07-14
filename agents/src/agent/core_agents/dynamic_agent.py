"""Dynamic agent configured with runtime model routing."""

from langchain.agents import create_agent
from langchain.chat_models import init_chat_model

from src.agent.core.context import (
    ConfigSchema,
    GeminiModel,
    ModelProvider,
    ModelRoutingMiddleware,
)

model = init_chat_model(
    model_provider=ModelProvider.GEMINI.value,
    model=GeminiModel.GEMINI_2_5_FLASH.value,
)
agent = create_agent(
    model=model,
    system_prompt="You are a helpful assistant",
    middleware=[ModelRoutingMiddleware()],  # type: ignore
    context_schema=ConfigSchema,
)  # type: ignore
