from backend.question_runtime.model import (
    QuestionRunTime,
    RuntimeConfigSource,
)
from backend.shared import ID
from backend.storage import FileData
from backend.utils import normalize_content

from .runtime_db import QuestionRuntimeDB
from .runtime_resolver import QuestionRunTimeResolver


class QuestionRunTimeSyncService:
    def __init__(
        self,
        runtime_db: QuestionRuntimeDB,
        resolver: QuestionRunTimeResolver | None = None,
    ) -> None:
        self._runtime_db = runtime_db
        self._resolver = resolver or QuestionRunTimeResolver()

    async def sync_from_files(
        self,
        question_id: ID,
        files: dict[str, str] | list[FileData],
        *,
        overwrite_manual: bool = False,
    ) -> list[QuestionRunTime]:

        if isinstance(files, list) and all(
            isinstance(file, FileData) for file in files
        ):
            files = self._convert_filedata(files)
        assert isinstance(files, dict)
        resolved = self._resolver.infer(files)
        existing = await self._runtime_db.list_question_runtimes(question_id)
        manual_languages = {
            runtime.language
            for runtime in existing
            if runtime.source == RuntimeConfigSource.MANUAL
        }
        synced = []
        for runtime in resolved:
            if runtime.language in manual_languages and not overwrite_manual:
                continue

            synced.append(await self._runtime_db.upsert(question_id, runtime))
        return synced

    @staticmethod
    def _convert_filedata(files: list[FileData]) -> dict[str, str]:
        data = {}
        for f in files:
            data[f.filename] = normalize_content(f.content)
        return data
