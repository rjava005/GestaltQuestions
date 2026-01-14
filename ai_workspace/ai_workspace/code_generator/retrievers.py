from ai_workspace.utils import load_vectorstore
from ai_workspace.ai_base.settings import get_settings
from pathlib import Path
# --- LangChain / OpenAI ---
from langchain_openai import OpenAIEmbeddings

# ---------------------------------------------------------------------
# Configuration & Embeddings
# ---------------------------------------------------------------------
settings = get_settings()

embeddings = OpenAIEmbeddings(model=settings.embedding_model)

# ---------------------------------------------------------------------
# Vectorstore Paths
# ---------------------------------------------------------------------
QUESTION_STORE_PATH = "ai_workspace/code_generator/vectorstores/question_store"
JS_STORE_PATH = "ai_workspace/code_generator/vectorstores/js_store"
PY_STORE_PATH = "ai_workspace/code_generator/vectorstores/python_store"
SOLUTION_STORE_PATH = "ai_workspace/code_generator/vectorstores/solution_store"

# ---------------------------------------------------------------------
# Loaded Vectorstores
# ---------------------------------------------------------------------
question_html_vectorstore = load_vectorstore(
    Path(QUESTION_STORE_PATH).resolve().as_posix(),
    name="question_html_vectorstore",
    embeddings=embeddings,
)

server_js_vectorstore = load_vectorstore(
    JS_STORE_PATH,
    name="server_js_store",
    embeddings=embeddings,
)

server_py_vectorstore = load_vectorstore(
    PY_STORE_PATH,
    name="server_py_store",
    embeddings=embeddings,
)

solution_html_vectorstore = load_vectorstore(
    SOLUTION_STORE_PATH,
    name="solution_store",
    embeddings=embeddings,
)
