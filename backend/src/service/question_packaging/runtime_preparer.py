from typing import Dict
import json

from pydantic import ValidationError
from src.core.logging import logger
from .models import Language, RuntimeExecutionConfig, RuntimePackageConfig
from .exceptions import (
    InvalidFilePayloadError,
    ConfigurationError,
    InvalidEntryError,
    RuntimeResolutionError,
)

CONFIG_KEY = "config.json"


class RuntimePreparer:
    """Resolve a validated runtime execution payload from uploaded files."""

    # ============================================================
    # Public API
    # ============================================================

    def prepare_runtime(
        self, files: Dict[str, str], *, language: Language | None = None
    ) -> RuntimeExecutionConfig:
        """Build a runtime execution config from files and an optional language."""
        logger.debug(
            "Preparing runtime. requested_language=%s file_count=%s",
            language,
            len(files),
        )

        self._validate_files(files)

        raw_config = files.get(CONFIG_KEY)
        if raw_config is None:
            logger.info(
                "No %s found. Falling back to runtime resolution from files.",
                CONFIG_KEY,
            )
            return self._build_runtime_without_config(files, language=language)

        package_config = self._parse_package_config(raw_config)
        resolved_language = self._resolve_language(
            package_config,
            requested_language=language,
        )
        runtime = self._build_runtime_from_package_config(
            package_config,
            resolved_language,
            files=files,
        )

        logger.info(
            "Prepared runtime successfully. language=%s entry=%s",
            runtime.language,
            runtime.entry,
        )
        return runtime

    # ============================================================
    # Internal Runtime Resolution
    # ============================================================

    def _resolve_language(
        self,
        package_config: RuntimePackageConfig,
        *,
        requested_language: Language | None = None,
    ) -> Language:
        """Resolve the target language from the request or package defaults."""
        available_languages = list(package_config.runtimes.keys())

        # Handle cases when a specific language is specified, there is a configuration file
        # But the runtime configuration does not have the language
        if requested_language is not None:
            if requested_language not in package_config.runtimes:
                raise ConfigurationError(
                    f"Requested runtime '{requested_language}' is not configured. "
                    f"Available runtimes: {available_languages}"
                )
            logger.debug("Using explicitly requested runtime: %s", requested_language)
            return requested_language

        # If there is a default language in the configuration
        if package_config.default_language is not None:
            logger.debug(
                "No runtime requested. Using package default: %s",
                package_config.default_language,
            )
            return package_config.default_language

        if len(available_languages) == 1:
            resolved_language = available_languages[0]
            logger.debug("Only one runtime is available. Using: %s", resolved_language)
            return resolved_language

        raise RuntimeResolutionError(
            "Runtime language is ambiguous. Pass a language explicitly when "
            "multiple runtimes are available."
        )

    def _build_runtime_without_config(
        self,
        files: Dict[str, str],
        *,
        language: Language | None,
    ) -> RuntimeExecutionConfig:
        """Build a runtime config from conventional entry files when config is absent."""
        if language is None:
            raise RuntimeResolutionError(
                "No config.json was provided, so a runtime language must be specified."
            )

        logger.debug("Building runtime without config. language=%s", language)

        if language == "javascript":
            entry = "server.js"
        else:
            entry = "server.py"

        if entry not in files:
            raise InvalidFilePayloadError(
                f"Expected entry file '{entry}' for runtime '{language}', "
                f"but it was not found. Available files: {list(files.keys())}"
            )

        self._validate_entry(entry, files)

        return RuntimeExecutionConfig(
            entry=entry,
            func_name="generate",
            language=language,
            files=files,
        )

    def _build_runtime_from_package_config(
        self,
        package_config: RuntimePackageConfig,
        language: Language,
        *,
        files: Dict[str, str],
    ) -> RuntimeExecutionConfig:
        """Build a runtime config from a validated package config."""
        logger.debug("Building runtime from package config. language=%s", language)

        selected = package_config.runtimes[language]
        self._validate_entry(selected.entry, files)

        return RuntimeExecutionConfig(
            **selected.model_dump(),
            files=files,
        )

    # ============================================================
    # Validation
    # ============================================================

    def _validate_files(self, files: Dict[str, str]) -> None:
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

    def _validate_entry(self, entry: str, files: Dict[str, str]) -> None:
        """Validate that the selected entry file exists and has usable content."""
        if entry not in files:

            raise InvalidEntryError(
                f"Configured entry file '{entry}' was not found in the payload. "
                f"Available files: {list(files.keys())}"
            )

        content = files[entry]
        if not isinstance(content, str):
            raise InvalidEntryError(
                f"Entry file '{entry}' has invalid content. Expected a string."
            )
        # Ignore the entry file can be empty it should not throw an error.
        # if not content.strip():
        #     raise ValueError(f"Entry file '{entry}' is empty.")

        logger.debug("Validated entry file successfully. entry=%s", entry)

    def _parse_package_config(self, raw_config: str | dict) -> RuntimePackageConfig:
        """Parse and validate the runtime package config from config.json."""
        logger.debug("Parsing runtime package config from %s", CONFIG_KEY)

        try:
            parsed = (
                json.loads(raw_config) if isinstance(raw_config, str) else raw_config
            )
        except json.JSONDecodeError as e:
            raise ConfigurationError(
                f"Failed to parse '{CONFIG_KEY}' as JSON: {e.msg}"
            ) from e
        try:
            package_config = RuntimePackageConfig.model_validate(parsed)

        except ValidationError as e:
            raise ConfigurationError(
                f"'{CONFIG_KEY}' is not a valid runtime package config: {e}"
            ) from e

        logger.debug("Runtime package config parsed successfully.")
        return package_config
