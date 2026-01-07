from typing import Annotated, TypedDict, Literal
from pathlib import Path
import json
from ai_workspace.utils import to_serializable

# --- Project Imports ---
from ai_workspace.models.models import (
    Question,
)
from typing import Sequence

# --- LangChain / LangGraph ---
from langgraph.graph import START, StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from ai_workspace.utils import save_graph_visualization, to_serializable
from ai_workspace.code_generator.graphs.question_metadata_graph import (
    QuestionMetaData,
)
from langgraph.types import Command
from ai_workspace.code_generator.graphs.question_html_graph import (
    app as question_html_generator,
)
from ai_workspace.code_generator.graphs.server_js_graph import (
    app as server_js_generator,
)
from ai_workspace.code_generator.graphs.server_py_graph import (
    app as server_py_generator,
)
from ai_workspace.code_generator.graphs.solution_html_graph import (
    app as solution_html_generator,
)
from ai_workspace.code_generator.graphs.question_metadata_graph import (
    app as question_metadata_generator,
)

memory = MemorySaver()
config = {"configurable": {"thread_id": "customer_123"}}


class State(TypedDict):
    question: Question
    metadata: QuestionMetaData | None
    # Append any files
    files: Annotated[dict, lambda a, b: {**a, **b}]


def classify_question(state: State):
    input_state = {"question": state["question"], "metadata": None}
    result = question_metadata_generator.invoke(input_state, config)  # type: ignore

    return {"metadata": result["metadata"]}


def generate_question_html(state: State):
    metadata = state["metadata"]
    assert metadata

    input_state = {
        "question": state["question"],
        "question_type": metadata.question_type,
        "question_html": None,
        "retrieved_documents": [],
        "formatted_examples": "",
    }

    result = question_html_generator.invoke(input_state, config)  # type: ignore

    updated_question = state["question"].model_copy(
        update={"question_html": result["question_html"]}
    )

    return {
        "question": updated_question,
        "files": {"question.html": result["question_html"]},
    }


def generate_solution_html(state: State):
    metadata = state["metadata"]
    assert metadata

    input_state = {
        "question": state["question"],
        "question_type": metadata.question_type,
        "solution_html": None,
        "retrieved_documents": [],
        "formatted_examples": "",
    }

    result = solution_html_generator.invoke(input_state, config)  # type: ignore

    return {"files": {"solution.html": result["solution_html"]}}


def generate_server_js(state: State):
    metadata = state["metadata"]
    assert metadata

    input_state = {
        "question": state["question"],
        "question_type": metadata.question_type,
        "server_js": None,
        "retrieved_documents": [],
        "formatted_examples": "",
    }

    result = server_js_generator.invoke(input_state, config)  # type: ignore

    return {"files": {"server.js": result["server_js"]}}


def generate_server_py(state: State):
    metadata = state["metadata"]
    assert metadata

    input_state = {
        "question": state["question"],
        "question_type": metadata.question_type,
        "server_js": None,
        "retrieved_documents": [],
        "formatted_examples": "",
    }

    result = server_py_generator.invoke(input_state, config)  # type: ignore

    return {"files": {"server.py": result["server_py"]}}


def generate_info_json(state: State):
    metadata = state["metadata"]
    assert metadata

    info_metadata = metadata.model_dump()
    info_metadata["ai_generated"] = True

    if metadata.question_type == "computational":
        info_metadata["languages"] = ["javascript", "python"]
        info_metadata["isAdaptive"] = True
    else:
        info_metadata["languages"] = []
        info_metadata["isAdaptive"] = False

    return {"files": {"info.json": json.dumps(to_serializable(info_metadata))}}


def router(
    state: State,
) -> Sequence[
    Literal["generate_solution_html", "generate_server_js", "generate_server_py"]
]:
    metadata = state["metadata"]
    assert metadata
    if metadata.question_type == "computational":
        return ["generate_server_py", "generate_server_js", "generate_solution_html"]
    else:
        return ["generate_solution_html"]


# Build the graph

graph = StateGraph(State)

graph.add_node("classify_question", classify_question)
graph.add_node("generate_question_html", generate_question_html)
graph.add_node("generate_solution_html", generate_solution_html)
graph.add_node("generate_server_js", generate_server_js)
graph.add_node("generate_server_py", generate_server_py)
graph.add_node("generate_info_json", generate_info_json)

graph.add_edge(START, "classify_question")
graph.add_edge("classify_question", "generate_question_html")

# Add the path mapping here
graph.add_conditional_edges(
    "generate_question_html",
    router,
    {
        "generate_solution_html": "generate_solution_html",
        "generate_server_js": "generate_server_js",
        "generate_server_py": "generate_server_py",
    },
)

graph.add_edge("generate_server_js", "generate_info_json")
graph.add_edge("generate_server_py", "generate_info_json")
graph.add_edge("generate_solution_html", "generate_info_json")

graph.add_edge("generate_info_json", END)


# memory = MemorySaver()
# app = workflow.compile(checkpointer=memory)
app = graph.compile()
if __name__ == "__main__":
    config = {"configurable": {"thread_id": "customer_123"}}
    question = Question(
        question_text="A car is traveling along a straight rode at a constant speed of 100mph for 5 hours calculate the total distance traveled",
        solution_guide=None,
        final_answer=None,
        question_html="",
    )
    input_state: State = {"question": question, "metadata": None, "files": {}}
    result = app.ainvoke(input_state, config=config)  # type: ignore

    # Save output
    output_path = Path(r"src/ai_processing/code_generator/outputs/gestalt_generator")
    save_graph_visualization(app, output_path, filename="gestalt_generator_graph.png")
    data_path = output_path / "output.json"
    data_path.write_text(json.dumps(to_serializable(result)))
