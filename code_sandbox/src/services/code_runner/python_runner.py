import os
from pathlib import Path
from textwrap import dedent

from src.services.code_runner.base import CodeRunner
from src.services.code_runner.models import Language, RuntimeExecutionConfig


class PythonScriptRunner(CodeRunner):
    """Runs Python code from a runtime execution configuration."""

    def __init__(
        self, runtime_config: RuntimeExecutionConfig, language: Language = "python"
    ):
        """Initialize Python runner with validated runtime config."""
        super().__init__(runtime_config, language)

    def _command_prefix(self) -> list[str]:
        """Return Python command used to execute inline script."""
        return ["python3", "-c"]

    def _initialize_env(self) -> None:
        """Build environment variables used by the Python subprocess."""
        self._env = os.environ.copy()

    def _build_runner_script(self, entry_point_path: str | Path) -> str:
        """Build inline bootstrap script that imports and calls configured function."""
        if isinstance(entry_point_path, Path):
            entry_point_path = entry_point_path.as_posix()

        bootstrap = dedent(
            f"""\
            import importlib.util
            import json
            from pathlib import Path

            entry = Path({entry_point_path!r}).resolve()
            func_name = {self.runtime_config.func_name!r}

            spec = importlib.util.spec_from_file_location("entry_module", entry)
            if spec is None or spec.loader is None:
                raise RuntimeError(f"Could not load module spec from {{entry}}")

            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)

            fn = getattr(mod, func_name, None)
            if not callable(fn):
                raise RuntimeError(f"Function '{{func_name}}' not found or not callable")

            result = fn()
            print(json.dumps(result))
            """
        )
        return bootstrap


if __name__ == "__main__":
    path = Path(r"../app_test/assets/generate.py").resolve()
    config = RuntimeExecutionConfig(
        entry="server.py",
        language="python",
        files={"server.py": path.read_text(encoding="utf-8")},
    )
    result = PythonScriptRunner(config, language="python").execute()
    print(result)
