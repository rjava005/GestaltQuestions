import os
from pathlib import Path

from src.services.code_runner.base import CodeRunner
from src.services.code_runner.models import Language, RuntimeExecutionConfig


class JavaScriptRunner(CodeRunner):
    """Runs JavaScript code from a runtime execution configuration."""

    def __init__(
        self, runtime_config: RuntimeExecutionConfig, language: Language = "javascript"
    ):
        """Initialize runner and prime environment and entry-point exports."""
        super().__init__(runtime_config, language)
        self._initialize_env()
        self._ensure_entry_exports_function()

    def _ensure_entry_exports_function(self) -> None:
        """Ensure the entry file exports the configured function name."""
        code = self._get_entry_point()
        if "module.exports" not in code:
            code += f"\nmodule.exports = {{ {self.runtime_config.func_name} }};"
        self._update_entry_point(code)

    def _build_runner_script(self, entry_point_path: str | Path) -> str:
        """Build inline Node script that requires and calls the entry module."""
        if isinstance(entry_point_path, Path):
            entry_point_path = entry_point_path.as_posix()

        runner = """
        const mod = require("%(path)s");
        let result;
        result = mod["%(func)s"]();
        console.log(JSON.stringify(result));
        """ % {
            "path": entry_point_path,
            "func": self.runtime_config.func_name,
        }
        return runner

    def _initialize_env(self) -> None:
        """Build environment variables used by the Node subprocess."""
        env = os.environ.copy()
        env["NODE_PATH"] = "/app/node_modules:/usr/lib/node_modules"
        self._env = env

    def _command_prefix(self) -> list[str]:
        """Return Node command used to execute inline script."""
        return ["node", "-e"]


if __name__ == "__main__":
    path = Path(r"../app_test/assets/generate.js").resolve()
    config = RuntimeExecutionConfig(
        entry="server.js",
        language="javascript",
        files={"server.js": path.read_text(encoding="utf-8")},
    )

    javascript_runner = JavaScriptRunner(config)
    print(javascript_runner.run())
