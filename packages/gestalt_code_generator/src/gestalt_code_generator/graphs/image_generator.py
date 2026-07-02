import base64

from langchain.chat_models import init_chat_model
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, START, StateGraph
from langgraph.runtime import Runtime
from pydantic import BaseModel, Field

from gestalt_code_generator.model import (
    ContextSchema,
    GeneralResponse,
    Question,
    QuestionImageAnalysis,
)
from gestalt_code_generator.utils import get_image_base64, load_prompt

IMAGE_ANALYSIS_PROMPT = load_prompt("textbook_image_classification.txt")
PHYSICS_TEXTBOOK_IMAGE_PROMPT_GENERATOR = load_prompt("textbook_image_generation.txt")
TEXTBOOK_IMAGE_STYLE = load_prompt("textbook_image_style.txt")


class ImageGeneratorInput(BaseModel):
    question: Question


class ImageGeneratorState(ImageGeneratorInput):
    analysis: QuestionImageAnalysis | None = Field(
        default=None,
        exclude=True,
        description="Internal graph state. Not intended as user input.",
    )
    image_prompt: str | None = None
    image: str | None = None


def analyze(state: ImageGeneratorState, runtime: Runtime[ContextSchema]):
    source_question = state.question.text
    model = init_chat_model(
        model=runtime.context.model, model_provider=runtime.context.model_provider
    ).with_structured_output(QuestionImageAnalysis)
    response = model.invoke(IMAGE_ANALYSIS_PROMPT.format(question=source_question))
    response = QuestionImageAnalysis.model_validate(response)
    return {"analysis": response}


def routing_function(state: ImageGeneratorState):
    if not state.analysis:
        return "stop"
    if state.analysis.requires_image:
        return "generate_prompt"
    return "stop"


def generate_prompt(state: ImageGeneratorState, runtime: Runtime[ContextSchema]):
    source_question = state.question.text
    model = init_chat_model(
        model=runtime.context.model, model_provider=runtime.context.model_provider
    ).with_structured_output(GeneralResponse)
    prompt = PHYSICS_TEXTBOOK_IMAGE_PROMPT_GENERATOR.format(question=source_question)
    response = model.invoke(prompt)
    response = GeneralResponse.model_validate(response)
    return {"image_prompt": response.response}


def generate_image(state: ImageGeneratorState):
    source_question = state.question.text
    if not state.image_prompt:
        raise ValueError("Image prompt must be valid")

    model = ChatGoogleGenerativeAI(model="gemini-3.1-flash-image")
    prompt = (
        TEXTBOOK_IMAGE_STYLE
        + state.image_prompt
        + f"\nSource Question: {source_question}\n"
    )

    response = model.invoke(prompt)
    # print("Response \n", response)
    image_base64 = get_image_base64(response)
    return {"image": image_base64}


builder = StateGraph(
    ImageGeneratorState,
    input_schema=ImageGeneratorInput,
    output_schema=ImageGeneratorState,
    context_schema=ContextSchema,
)

builder.add_node("analyze", analyze)
builder.add_node("generate_prompt", generate_prompt)
builder.add_node("generate_image", generate_image)

builder.add_edge(START, "analyze")
builder.add_conditional_edges(
    "analyze", routing_function, {"generate_prompt": "generate_prompt", "stop": END}
)

builder.add_edge("generate_prompt", "generate_image")

builder.add_edge("generate_image", END)
builder.add_edge("analyze", END)
graph = builder.compile()


if __name__ == "__main__":
    from dotenv import load_dotenv

    load_dotenv()

    result = graph.invoke(
        ImageGeneratorInput(
            question=Question(
                text="A 2 kg block rests on a frictionless inclined plane angled 30 degrees above the horizontal. A rope pulls the block up the incline with a tension of 15 N, parallel to the surface. Draw or refer to the diagram of the forces on the block, then determine the block's acceleration along the incline."
            ),
        ),
        context=ContextSchema(
            model="gemini-3.5-flash",
            model_provider="google_genai",
        ),
    )
    # print(result)
    result = ImageGeneratorState.model_validate(result)
    png_data = graph.get_graph().draw_mermaid_png()
    with open("graph.png", "wb") as f:
        f.write(png_data)
    image_bytes = base64.b64decode(result.image)  # type: ignore
    with open("generated_image.png", "wb") as f:
        f.write(image_bytes)
