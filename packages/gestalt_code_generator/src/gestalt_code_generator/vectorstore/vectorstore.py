from pathlib import Path
from functools import lru_cache
from dotenv import load_dotenv
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from gestalt_code_generator.document_loader import QuestionDocumentLoader


load_dotenv()
CSV_PATH = Path(r"./data/QuestionDataV2_06122025_classified.csv").resolve()
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
vector_store = InMemoryVectorStore(embeddings)

@lru_cache
def build_vectorstore_from_csv(
    question_data_csv_path: Path = CSV_PATH,
) -> InMemoryVectorStore:
    example_pairs = [
        ("question", "question.html"),
        ("question.html", "server.js"),
        ("question.html", "server.py"),
        ("question.html", "solution.html"),
    ]
    all_docs = []
    for inp, out in example_pairs:
        all_docs.extend(
            QuestionDocumentLoader(
                input_col=inp, output_col=out, csv_path=question_data_csv_path
            ).lazy_load()
        )
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    vectorstore = InMemoryVectorStore(embedding=embeddings)
    vectorstore.add_documents(all_docs)
    return vectorstore
