from typing import Literal

from langgraph.graph import END, START, StateGraph
from langgraph.runtime import Runtime
from pydantic import BaseModel

from gestalt_code_generator.model import ContextSchema
from gestalt_code_generator.utils import save_graph


class CodeState(BaseModel):
    code: str
    feedback: str
    iterations: int


def generator_node(state: CodeState, runtime: Runtime[ContextSchema]):
    # Logic to generate or refine code
    return {"code": "...", "iterations": state.iterations + 1}


def should_continue(state: CodeState) -> Literal["generator_node", "stop"]:
    if state.iterations < 3:  # Limit to 3 iterations
        return "generator_node"
    return "stop"


builder = StateGraph(CodeState, context_schema=ContextSchema)
builder.add_node("generator_node", generator_node)
builder.add_edge(START, "generator_node")
builder.add_conditional_edges(
    "generator_node", should_continue, {"generator_node": "generator_node", "stop": END}
)

graph = builder.compile()

if __name__ == "__main__":
    save_graph(graph, "./code_iterations.png")
