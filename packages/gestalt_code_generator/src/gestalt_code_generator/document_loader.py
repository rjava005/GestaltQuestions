from pathlib import Path
from typing import Iterator

import pandas as pd
from langchain_core.document_loaders import BaseLoader
from langchain_core.documents import Document


class QuestionDocumentLoaderError(Exception):
    """Raised when QuestionDocumentLoader cannot load or validate input data."""


class QuestionDocumentLoader(BaseLoader):
    """Load question examples from a CSV file as LangChain documents.

    The loader reads input and output example columns, marks rows with server
    implementation files as adaptive, and yields one document per row with a
    non-empty input example.
    """

    _SERVER_FILES = ["server.js", "server.py"]

    def __init__(self, input_col: str, output_col: str, csv_path: str | Path):
        """Initialize the loader with CSV path and example column names."""
        self._file_path = csv_path
        self._input_example = input_col
        self._ouput_example = output_col
        # Loads and prepare data
        self._load_data()
        self._prepare_data()

    def lazy_load(self) -> Iterator[Document]:
        """Yield documents for CSV rows that contain an input example."""
        for index in self._df.index:
            input_example = self._df.loc[index, self._input_example]
            output_example = self._df.loc[index, self._ouput_example]
            if pd.isna(input_example):
                continue
            content_string = f"""Input Example: {input_example}
                Output Example: {output_example}
                """
            doc_id = f"{Path(self._file_path).stem}:{index}:{self._input_example}->{self._ouput_example}"
            yield Document(
                id=doc_id,
                page_content=content_string,
                metadata={
                    "source": Path(self._file_path).stem,
                    "index": index,
                    "isAdaptive": bool(self._df.loc[index, "is_adaptive"]),
                    "output_is_nan": pd.isna(output_example),
                    "input_col": self._input_example,
                    "output_col": self._ouput_example,
                },
            )

    def _prepare_data(self):
        """Add the adaptive marker column based on server file content."""
        mask = pd.Series(False, index=self._df.index)

        for s in self._SERVER_FILES:
            mask |= self._df[s].notna() & self._df[s].astype(str).str.strip().ne("")

        self._df["is_adaptive"] = mask.astype(str)

    def _load_data(self):
        """Load the CSV data, wrapping read errors in QuestionDocumentLoaderError."""
        try:
            self._df = pd.read_csv(self._file_path)
        except FileNotFoundError as e:
            raise QuestionDocumentLoaderError(
                f"CSV file not found: {self._file_path}"
            ) from e
        except pd.errors.EmptyDataError as e:
            raise QuestionDocumentLoaderError(
                f"CSV file is empty: {self._file_path}"
            ) from e
        except pd.errors.ParserError as e:
            raise QuestionDocumentLoaderError(
                f"CSV file could not be parsed: {self._file_path}"
            ) from e
        except OSError as e:
            raise QuestionDocumentLoaderError(
                f"CSV file could not be read: {self._file_path} ({e})"
            ) from e
        except Exception as e:
            raise QuestionDocumentLoaderError(
                f"Unexpected error loading CSV file {self._file_path}: {e}"
            ) from e

    def _validate_csv(self):
        """Validate that required input, output, and server columns exist."""
        columns_to_check = list(
            dict.fromkeys(
                [
                    *self._SERVER_FILES,
                    self._ouput_example,
                    self._input_example,
                ]
            )
        )
        for c in columns_to_check:
            if c not in self._df.columns:
                available_columns = ", ".join(map(str, self._df.columns))
                raise QuestionDocumentLoaderError(
                    f"Column name {c!r} is not valid for CSV file "
                    f"{self._file_path}. Available columns: {available_columns}"
                )

    def _export_csv(self, filepath: str | Path):
        """Write the processed dataframe to CSV and return the output path."""
        output_path = Path(filepath)
        self._df.to_csv(output_path, index=False)
        return output_path


if __name__ == "__main__":
    csv_path = Path(
        r"src/gestalt_code_generator/data/QuestionDataV2_06122025_classified.csv"
    ).resolve()
    loader = QuestionDocumentLoader(
        input_col="question", output_col="server.js", csv_path=csv_path
    )
    loader._export_csv("src/gestalt_code_generator/data/questionDataProcessed.csv")
    docs = list(loader.lazy_load())
    # for doc in docs:
    #     print(type(doc))
    #     print(doc)
