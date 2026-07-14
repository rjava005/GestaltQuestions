from langgraph.graph import END, START, StateGraph

from gestalt_code_generator.graphs.server_generator import (
    graph as server_graph,
)
from gestalt_code_generator.model import (
    CodeArtifact,
    GeneratorContext,
    Question,
    QuestionExampleColumn,
    ServerExampleColumn,
)
from gestalt_code_generator.model.context import GeneratorContext
from gestalt_code_generator.model.graph_models import (
    BaseGeneratorInput,
    BaseGeneratorState,
)


class ServerState(BaseGeneratorInput[QuestionExampleColumn, ServerExampleColumn]):
    source_example_col: QuestionExampleColumn = "question.html"
    target_example_col: ServerExampleColumn
    prompt: str


builder = StateGraph(
    BaseGeneratorState, input_schema=ServerState, context_schema=GeneratorContext
)
builder.add_node("generate_server", server_graph)
builder.add_edge(START, "generate_server")
builder.add_edge("generate_server", END)
graph = builder.compile()


def generate_server_js(
    question: Question, question_html: str, context: GeneratorContext
) -> CodeArtifact:
    try:
        result = graph.invoke(
            ServerState(
                question=question,
                prompt="Generate js code",
                question_html=question_html,
                target_example_col="server.js",
            ),
            context=context,
        )
        code = BaseGeneratorState.model_validate(result).code
        if code:
            return code
    except Exception as exc:
        return CodeArtifact(filename="server.js", content=str(exc))

    return CodeArtifact(filename="server.js", content="")


def generate_server_py(
    question: Question, question_html: str, context: GeneratorContext
) -> CodeArtifact:
    try:
        result = graph.invoke(
            ServerState(
                question=question,
                prompt="Generate py code",
                question_html=question_html,
                target_example_col="server.py",
            ),
            context=context,
        )
        code = BaseGeneratorState.model_validate(result).code
        if code:
            return code
    except Exception as exc:
        return CodeArtifact(filename="server.py", content=str(exc))

    return CodeArtifact(filename="server.py", content="")


if __name__ == "__main__":
    import json
    from pathlib import Path

    from gestalt_code_generator.utils import to_serializable
    from gestalt_code_generator.vectorstore import build_vectorstore_from_csv

    vector_store = build_vectorstore_from_csv()

    question = Question(
        text="A car is traveling along a straight rode at a constant speed of 100mph for 5 hours what is the total distance covered",
        solution_guide=(
            "Use the distance formula: distance = speed * time. "
            "The speed is 100 miles per hour and the time is 5 hours. "
            "Multiply 100 by 5 to get 500 miles."
        ),
    )

    context = GeneratorContext(
        model="gemini-2.5-flash",
        model_provider="google_genai",
        vectorstore=vector_store,
    )
    result = generate_server_js(question, question_html=question.text, context=context)
    Path("./output").write_text(json.dumps(to_serializable(result), indent=2))
