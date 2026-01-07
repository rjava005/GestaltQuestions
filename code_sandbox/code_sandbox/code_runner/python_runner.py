# Stdlib
import importlib.util
import io
import json
import tempfile
from contextlib import redirect_stdout
from pathlib import Path
from typing import Any

# Internal
from code_sandbox.code_runner.base import CodeRunner
from code_sandbox.code_runner.models import ExecutionResult


class PythonScriptRunner(CodeRunner):
    def __init__(self, func_name: str = "generate", suffix: str = ".py"):
        self.func_name = func_name
        self.suffix = suffix

    def import_module_from_path(
        self,
        path: str | Path,
    ) -> Any:
        """
        Dynamically imports a Python module from a given file path.

        Args:
            path (str): Path to the Python module.
            module_name (str): Name to assign to the imported module.

        Returns:
            module: The imported module object.

        Raises:
            ImportError: If the module cannot be imported.
        """
        spec = importlib.util.spec_from_file_location(self.func_name, path)
        if spec is None or spec.loader is None:
            raise ImportError(f"Could not load spec from path: {path}")
        module = importlib.util.module_from_spec(spec)
        try:
            spec.loader.exec_module(module)
        except Exception as e:
            raise ImportError(f"Error executing module '{path}': {e}")
        return module

    def run(self, code: str) -> ExecutionResult:
        with tempfile.NamedTemporaryFile(
            mode="w", delete=False, suffix=self.suffix
        ) as tmp:
            tmp.write(code)
            tmp_path = tmp.name
        tmp_path_posix = Path(tmp_path).as_posix()
        try:
            module = self.import_module_from_path(tmp_path_posix)
        except Exception as e:
            raise ValueError(f"Could not import python module {e}")

        generate = getattr(module, self.func_name, None)
        if not callable(generate):
            raise ValueError(
                "Function 'generate' not found or not callable in the Python module."
            )
        # Get the print statements

        try:
            f = io.StringIO()
            with redirect_stdout(f):
                result = generate()
            captured = f.getvalue().splitlines()
        except Exception as e:
            raise ValueError(f"Error executing python {self.func_name} : {e}")
        return ExecutionResult(output=json.dumps(result), logs=captured)


if __name__ == "__main__":
    path = Path(r"app_test/test_code/generate.py").resolve()
    content = path.read_text()
    runner = PythonScriptRunner()
    runner.run(content)
