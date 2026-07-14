import json

from pydantic import ValidationError

from backend.core import logger
from backend.question_runtime.exceptions import (
    ConfigurationError,
    InvalidFilePayloadError,
)
from backend.question_runtime.model import RuntimeConfigSource, RuntimeLanguage
from backend.question_runtime.schema import (
    QuestionRuntimeCreate,
    RunTimeConfig,
)


class QuestionRunTimeResolver:
    _CONFIG_KEY = "config.json"

    def infer(self, files: dict[str, str]) -> list[QuestionRuntimeCreate]:
        self._validate_files(files)
        if self._CONFIG_KEY in files:
            return self._from_config_file(files[self._CONFIG_KEY])
        return self._from_conventions(files)

    def _from_config_file(self, raw_config: str | dict) -> list[QuestionRuntimeCreate]:
        runtimes: list[QuestionRuntimeCreate] = []
        for r in self._validate_config(raw_config).runtimes:
            runtimes.append(
                QuestionRuntimeCreate(
                    **r.model_dump(), source=RuntimeConfigSource.CONFIG_FILE
                )
            )
        return runtimes

    def _from_conventions(self, files: dict[str, str]) -> list[QuestionRuntimeCreate]:
        runtimes: list[QuestionRuntimeCreate] = []

        if "server.py" in files:
            runtimes.append(
                QuestionRuntimeCreate(
                    language=RuntimeLanguage.PYTHON,
                    entry="server.py",
                    func_name="generate",
                    source=RuntimeConfigSource.INFERRED,
                    is_default=False,
                )
            )
        if "server.js" in files:
            runtimes.append(
                QuestionRuntimeCreate(
                    language=RuntimeLanguage.JAVASCRIPT,
                    entry="server.js",
                    func_name="generate",
                    source=RuntimeConfigSource.INFERRED,
                    is_default=not runtimes,
                )
            )
        return runtimes

    def _validate_config(self, raw_config: dict | str) -> RunTimeConfig:
        try:
            parsed = (
                json.loads(raw_config) if isinstance(raw_config, str) else raw_config
            )
        except json.JSONDecodeError as e:
            raise ConfigurationError(
                f"Failed to parse '{self._CONFIG_KEY}' as JSON: {e.msg}"
            ) from e
        try:
            config = RunTimeConfig.model_validate(parsed)
            logger.debug("Runtime package config parsed successfully.")
            return config
        except ValidationError as e:
            raise ConfigurationError(
                f"'{self._CONFIG_KEY}' is not a valid runtime package config: {e}"
            ) from e

    def _validate_files(self, files: dict[str, str]) -> None:
        """Validate the uploaded file payload before resolving a runtime."""
        if not files:
            raise InvalidFilePayloadError(
                "File payload is empty. At least one file is required."
            )

        invalid_names: list[str] = []
        invalid_contents: list[str] = []

        for filename, content in files.items():
            if not isinstance(filename, str) or not filename.strip():
                invalid_names.append(str(filename))
                continue

            normalized = filename.replace("\\", "/")

            # Reject obviously unsafe paths and keep file names relative.
            if normalized.startswith("/") or ".." in normalized.split("/"):
                invalid_names.append(filename)

            if not isinstance(content, str):
                invalid_contents.append(filename)

        if invalid_names:
            raise InvalidFilePayloadError(
                "One or more file paths are invalid. File names must be relative, "
                f"non-empty paths without '..'. Invalid entries: {invalid_names}"
            )

        if invalid_contents:
            raise InvalidFilePayloadError(
                "One or more files have invalid content types. "
                f"Expected string content for files: {invalid_contents}"
            )

        logger.debug("Validated file payload successfully.")
