from typing import List

from src.model.files import FileData
from src.service.question_packaging.models import (
    PreparedAdaptiveQuestion,
    PreparedQuestion,
    PreparedStaticQuestion,
    QuestionFiles,
)

from src.utils.normalization_utils import normalize_content
from src.service.question_packaging.models import Language
from .runtime_preparer import RuntimePreparer


class QuestionPackageBuilder:
    def build(
        self,
        question_files: List[FileData],
        is_adaptive: bool,
        language: Language | None = None,
    ) -> PreparedQuestion:
        files = QuestionFiles.from_file_data(question_files)
        f = {fd.filename: normalize_content(fd.content) for fd in question_files}

        if is_adaptive:
            return PreparedAdaptiveQuestion(
                kind="adaptive",
                runtime=RuntimePreparer().prepare_runtime(f, language=language),
                question_files=files,
            )

        return PreparedStaticQuestion(question_files=files, kind="static")
