import pytest

from gestalt_code_generator.document_loader import (
    QuestionDocumentLoader,
    QuestionDocumentLoaderError,
)


def test_real_question_data_has_required_columns(question_data_csv_path):
    loader = QuestionDocumentLoader(
        input_col="question",
        output_col="server.js",
        csv_path=question_data_csv_path,
    )

    loader._validate_csv()

    assert {"server.js", "server.py", "question"}.issubset(loader._df.columns)


def test_validate_csv_rejects_missing_input_column(question_data_csv_path):
    loader = QuestionDocumentLoader(
        input_col="missing_question_column",
        output_col="server.js",
        csv_path=question_data_csv_path,
    )

    with pytest.raises(QuestionDocumentLoaderError, match="missing_question_column"):
        loader._validate_csv()


def test_lazy_load_uses_expected_columns_in_document_metadata(question_data_csv_path):
    loader = QuestionDocumentLoader(
        input_col="question",
        output_col="server.js",
        csv_path=question_data_csv_path,
    )

    first_doc = next(loader.lazy_load())

    assert first_doc.metadata["input_col"] == "question"
    assert first_doc.metadata["output_col"] == "server.js"
    assert first_doc.metadata["source"] == question_data_csv_path.stem
    assert "Input Example:" in first_doc.page_content
    assert "Output Example:" in first_doc.page_content
