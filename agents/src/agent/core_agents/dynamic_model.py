from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.runtime import Runtime

from agent.core.context import ConfigSchema

load_dotenv()


def call_model(state: MessagesState, runtime: Runtime[ConfigSchema]):
    # Get model choice from frontend (passed via runtime context)
    model = init_chat_model(
        model=runtime.context.model, model_provider=runtime.context.model_provider
    )

    response = model.invoke(state["messages"])
    return {"messages": [response]}


# Compile graph with config_schema
builder = StateGraph(MessagesState, context_schema=ConfigSchema)
builder.add_node("model", call_model)
builder.add_edge(START, "model")
builder.add_edge("model", END)
graph = builder.compile()

if __name__ == "__main__":
    response = graph.invoke(
        {"messages": [{"role": "user", "content": "hi"}]},  # type: ignore
        context={"model": "gemini-3.5-flash"},  # type: ignore, # type: ignore
    )
