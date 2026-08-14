# CLAUDE.md — code_sandbox (execution + grading service)

Standalone FastAPI service (port 8080) that runs authored question code and grades
submitted math. **This is the security boundary of the platform.** The backend never
executes question code itself; it POSTs here.

App is `src/main.py:app`. Two routers only:

- `POST /code_runner/generate` — run a question's `generate()` and return its JSON
- `POST /grading/grade` — grade submitted answers against private grading data

## Commands

```bash
python -m pytest app_test
```

21 tests, all passing (~24 s warm). Serve with
`python -m uvicorn src.main:app --reload --port 8080`, or via root `docker compose up`.

**Cold-start caveat:** `test_python_runtime_can_import_signal_system_helpers` can fail
with `ExecutionError: python execution timed out after 15 seconds` on the very first run
on a cold machine — importing `control`/`numpy` in a fresh subprocess exceeds
`PythonScriptRunner.EXECUTION_TIMEOUT_SECONDS`. Re-run; it passes once the imports are
warm. If this becomes chronic, raise that constant rather than trimming the helper API.

On Windows, `_command_prefix()` shells out to `python3`, which may resolve to a
**different interpreter** than the `python` running pytest (here: 3.14.6 via scoop vs
3.13.9). Anything the runtime needs must be installed in whatever `python3` resolves to.

## Execution model

`services/code_runner/base.py:CodeRunner` is the shared pipeline; `PythonScriptRunner`
and `JavaScriptRunner` supply three hooks (`_command_prefix`, `_build_runner_script`,
`_initialize_env`).

```
validate language + entry-in-files
  -> tempfile.TemporaryDirectory(prefix="runner_", dir=/app/tmp or system temp)
  -> write every config.files entry into that dir
  -> build an inline bootstrap script that imports the entry file and calls func_name
  -> subprocess.run(cmd, cwd=tmp, capture_output=True, timeout=N, check=True, env=env)
  -> last stdout line is the JSON result; earlier lines are captured as logs
```

Isolation today is: fresh temp dir per call, wall-clock timeout, and a subprocess
boundary. There is **no** filesystem jail, network restriction, memory cap, or user
separation — the container is the real boundary. Keep that in mind before widening what
runtimes can do.

Timeouts: base `CodeRunner` 5 s, `PythonScriptRunner` overrides to 15 s, grading worker
15 s.

Conventions worth preserving:
- The JSON-on-last-stdout-line protocol is why authored `print()` output survives as
  `logs`. Anything you add that writes to stdout after the result will break parsing.
- A parsed result containing an `"error"` key is treated as a failure.
- `_initialize_env()` in the Python runner prepends `src/` to `PYTHONPATH` so runtimes
  can `import gestalt_signal_systems`; that is the only trusted module exposed.

## gestalt_signal_systems

`src/gestalt_signal_systems/` is the vetted numerical surface authored runtimes may
import. It is *also* imported by the grading endpoint, so treat it as trusted code.

- `signals.py` — continuous/discrete/piecewise signals, impulses, step, sampling,
  convolution, Laplace/Fourier/Z transforms.
- `control_systems.py` — `transfer_function`, `series`, `parallel`, `feedback`,
  `time_response`, `frequency_response` (python-control 0.10.x).
- `serialization.py` — `finite_json`, which is what keeps plot payloads bounded/finite.
- `grading.py` — restricted MathJSON validation → SymPy → equivalence grading.

Every helper must return **bounded, finite, JSON-serializable** data; sample counts and
ranges are capped on purpose. Adding an unbounded generator would let an authored
question hang or blow up the response.

## Grading

`web/grading.py` runs `grade_answers` in a **spawned subprocess** with a 15 s join, then
terminates it on overrun (408) and reports a non-zero exit as 400. Do not "simplify" this
into an in-process call — the subprocess is what contains a SymPy pathology.

`grading.py` enforces the answer-slot contract:

- Input is **MathJSON**, never LaTeX. Submitted LaTeX is never parsed or `sympify`d.
- `validate_mathjson` recursively checks operators against per-slot allowlists
  (`_ARITHMETIC`, `_CALCULUS`, `_STRUCTURAL`, `_FUNCTIONS`, `_CONSTANTS`) and enforces
  `ExpressionLimits` (max depth 32, max nodes 512) before any SymPy object is built.
- Slot types supported: numeric, symbolic/algebraic, transfer-function, definite and
  improper integrals, derivatives/partial derivatives, finite sums, one/two-sided limits.
- `answer_specs` from the runtime declares `type`, tolerances, `allowed_variables`,
  `bound_variables`, `allowed_operators`, `calculus_operations`.

Statuses are exactly `correct` | `incorrect` | `invalid`.

**Never** introduce `sympify` on a raw string, `eval`, or `parse_latex` here. The
validate-then-construct order is the whole security argument.

## Pinning

`sympy == 1.14.0` and `control >= 0.10, < 0.11` are pinned deliberately — grading
equivalence and response shapes depend on them. Bumping either requires re-running
`app_test/test_signal_systems.py`.
