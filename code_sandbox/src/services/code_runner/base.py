from abc import ABC, abstractmethod
import copy
import json
from pathlib import Path
import subprocess
from subprocess import CompletedProcess
import tempfile

from .error_handling import ExecutionError
from .models import ExecutionResult, Language, RuntimeExecutionConfig


class CodeRunner(ABC):
    """Shared execution pipeline for language-specific runners."""

    def __init__(self, runtime_config: RuntimeExecutionConfig, language: Language):
        """Copy runtime config and validate language/entry requirements."""
        self.runtime_config = copy.deepcopy(runtime_config)
        self.language = language
        self._validate_runtime()
        self._validate_entry_point()

    @abstractmethod
    def _build_runner_script(self, entry_point_path: str | Path) -> str:
        """Return the inline script executed by the subprocess."""
        raise NotImplementedError(
            "_build_runner_script must be implemented by subclass"
        )

    @abstractmethod
    def _command_prefix(self) -> list[str]:
        """Return command prefix used to execute inline script (e.g. node/python)."""
        raise NotImplementedError("_command_prefix must be implemented by subclass")

    @abstractmethod
    def _initialize_env(self) -> None:
        """Initialize runner environment for subprocess execution."""
        raise NotImplementedError("_initialize_env must be implemented by subclass")

    def execute(self) -> CompletedProcess:
        """Write runtime files to temp workspace and execute the subprocess."""
        tmp_dir_name = self._get_temp_dir_name()
        with tempfile.TemporaryDirectory(prefix="runner_", dir=tmp_dir_name) as tmp_dir:
            tmp_path = Path(tmp_dir)

            # Materialize runtime-provided files in isolated workspace.
            for filename, content in self.runtime_config.files.items():
                (tmp_path / filename).write_text(content, encoding="utf-8")

            entry_point = (tmp_path / self.runtime_config.entry).as_posix()
            runner = self._build_runner_script(entry_point)
            command = [*self._command_prefix(), runner]
            env = self._initialize_env()

            try:
                result = subprocess.run(
                    command,
                    cwd=tmp_path,
                    capture_output=True,
                    text=True,
                    timeout=5,
                    check=True,
                    env=env,
                )
            except subprocess.CalledProcessError as e:
                raise ExecutionError(
                    f"{self.language} subprocess failed while executing "
                    f"'{self.runtime_config.entry}'. stderr: {e.stderr}"
                )
            except subprocess.TimeoutExpired:
                raise ExecutionError(
                    f"{self.language} execution timed out after 5 seconds."
                )
            except Exception as e:
                raise ExecutionError(
                    f"Unexpected failure while running {self.language} subprocess: {e}"
                )

        return result

    def run(self) -> ExecutionResult:
        """Execute, parse final JSON result, and return captured logs."""
        raw_results = self.execute()

        if raw_results.returncode != 0:
            raise ExecutionError(
                f"{self.language} execution crashed:\n{raw_results.stderr}"
            )

        stdout = raw_results.stdout.strip()
        stderr = raw_results.stderr.strip()

        # Convention: last stdout line is JSON result, previous lines are logs.
        last_line = stdout.splitlines()[-1] or ""
        print_statements = stdout.splitlines()[:-1]

        try:
            parsed = json.loads(last_line)
        except json.JSONDecodeError as e:
            raise ExecutionError(
                f"Failed to parse {self.language} output as JSON: {e}\n"
                f"Raw stdout:\n{stdout}\n"
                f"Raw stderr:\n{stderr}"
            )

        if "error" in parsed:
            raise ExecutionError(f"{self.language} execution error: {parsed['error']}")

        return ExecutionResult(output=parsed, logs=print_statements)

    def _validate_runtime(self) -> None:
        """Ensure runtime config language matches runner language."""
        if self.runtime_config.language != self.language:
            raise ValueError(
                f"Runtime language mismatch: config expects '{self.runtime_config.language}' "
                f"but runner is '{self.language}'"
            )

    def _validate_entry_point(self) -> None:
        """Ensure configured entry file exists in provided runtime files."""
        entry = self.runtime_config.entry
        if entry not in self.runtime_config.files:
            raise ValueError(
                f"Entry point '{entry}' not found in provided files. "
                f"Available: {list(self.runtime_config.files.keys())}"
            )

    def _get_entry_point(self) -> str:
        """Return entry-point source code content."""
        entry_point = self.runtime_config.entry
        content = self.runtime_config.files.get(entry_point, "")
        if not content:
            raise ValueError(f"Entry point {entry_point} is a empty file.")
        return content

    def _update_entry_point(self, content: str) -> str:
        """Replace entry-point source code content in runtime files."""
        entry_point = self.runtime_config.entry
        self.runtime_config.files[entry_point] = content
        return self.runtime_config.files[entry_point]

    def _get_temp_dir_name(self) -> str:
        """Return preferred temp dir path, fallback to system temp dir."""
        tmp_dir_path = Path("/app/tmp")
        if not tmp_dir_path.exists():
            tmp_dir_path = Path(tempfile.gettempdir())
        return tmp_dir_path.as_posix()

    def __str__(self) -> str:
        """Human-readable runner label."""
        return f"{self.language} runner"
