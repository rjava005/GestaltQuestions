import json

from langchain.chat_models import init_chat_model
from langgraph.graph import END, START, StateGraph
from langgraph.runtime import Runtime

from gestalt_code_generator.model import (
    CodeArtifact,
    CodeResponse,
    GeneratorContext,
    Question,
)
from gestalt_code_generator.model.graph_models import (
    BaseGeneratorInput,
    BaseGeneratorState,
)
from gestalt_code_generator.model.models import CodeArtifact
from gestalt_code_generator.utils import load_prompt, save_graph

from .base_generator import graph as subgraph

PREDEFINED_PARAMETERS_PROMPT = load_prompt("predefined_parameters_prompt.txt")
FINAL_ANSWERS_PROMPT = load_prompt("final_answers_prompt.txt")


def add_predefined_parameters(
    state: BaseGeneratorState, runtime: Runtime[GeneratorContext]
):
    if state.code is None:
        raise ValueError("add_predefined_parameters requires state.code to be present.")
    original_question = state.question.text
    code = state.code.content
    prompt = PREDEFINED_PARAMETERS_PROMPT.replace(
        "__ORIGINAL_QUESTION__", original_question
    ).replace("__CODE__", code)
    model = init_chat_model(
        model=runtime.context.model, model_provider=runtime.context.model_provider
    ).with_structured_output(CodeResponse)
    response = model.invoke(prompt)
    code = CodeResponse.model_validate(response).code
    return {"code": CodeArtifact(filename=state.code.filename, content=code)}


def router(state: BaseGeneratorState, runtime: Runtime[GeneratorContext]):
    if state.question.final_answer:
        return "add_final_answers"
    else:
        return "stop"


def add_final_answers(state: BaseGeneratorState, runtime: Runtime[GeneratorContext]):
    if state.code is None:
        raise ValueError("add_final_answers requires state.code to be present.")

    final_answers = state.question.final_answer
    if not final_answers:
        return {"code": state.code}

    original_question = state.question.text
    code = state.code.content
    prompt = (
        FINAL_ANSWERS_PROMPT.replace("__ORIGINAL_QUESTION__", original_question)
        .replace("__FINAL_ANSWERS__", final_answers)
        .replace("__CODE__", code)
    )
    model = init_chat_model(
        model=runtime.context.model, model_provider=runtime.context.model_provider
    ).with_structured_output(CodeResponse)
    response = model.invoke(prompt)
    code = CodeResponse.model_validate(response).code
    return {"code": CodeArtifact(filename=state.code.filename, content=code)}


builder = StateGraph(
    BaseGeneratorState,
    input_schema=BaseGeneratorInput,
    context_schema=GeneratorContext,
)
builder.add_node("generate_base_code", subgraph)
builder.add_node("add_predefined_parameters", add_predefined_parameters)
builder.add_node("add_final_answers", add_final_answers)

builder.add_edge(START, "generate_base_code")
builder.add_edge("generate_base_code", "add_predefined_parameters")

builder.add_conditional_edges(
    "add_predefined_parameters",
    router,
    {"add_final_answers": "add_final_answers", "stop": END},
)
builder.add_edge("add_final_answers", END)


graph = builder.compile()

# Define the specific graphs for server.js and server.py


if __name__ == "__main__":
    from gestalt_code_generator.utils import to_serializable
    from pathlib import Path
    from gestalt_code_generator.vectorstore import build_vectorstore_from_csv
    import json

    vector_store = build_vectorstore_from_csv()
    result = graph.invoke(
        BaseGeneratorState(
            question=Question(
                text="A car is traveling along a straight rode at a constant speed of 100mph for 5 hours what is the total distance covered"
            ),
            prompt="Generate a server.js file for the following",
            source_example_col="question.html",
            target_example_col="server.js",
            testing=True,
        ),
        context=GeneratorContext(
            model="gemini-2.5-flash",
            model_provider="google_genai",
            vectorstore=vector_store,
        ),
    )
    Path("./output").write_text(json.dumps(to_serializable(result), indent=2))

    save_graph(graph, "./server_generator.png")
