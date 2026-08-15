# CLAUDE.md — GestaltQuestions (repo root)

Monorepo for **Gestalt Questions**, an engineering question-authoring and practice
platform. A "question" is a portable bundle (HTML + optional Python/JS generator +
assets) whose metadata lives in Postgres and whose files live in local storage or
Firebase Storage. Adaptive questions are executed in a **separate sandbox service**,
never in the API process.

`CODEBASE.md` is the long-form developer guide and stays authoritative for narrative
detail. This file is the working brief: what is true, what to run, and what to avoid.

## Services

| Dir             | What it is                                            | Port | CLAUDE.md            |
| --------------- | ----------------------------------------------------- | ---- | -------------------- |
| `backend/`      | FastAPI + SQLModel API, storage/runtime orchestration | 8000 | `backend/CLAUDE.md`      |
| `frontend/`     | React 19 + TypeScript + Vite UI                       | 5173 | `frontend/CLAUDE.md`     |
| `code_sandbox/` | FastAPI code-execution + grading service              | 8080 | `code_sandbox/CLAUDE.md` |
| `db` (compose)  | Postgres 18                                           | 5432 | —                    |

Auxiliary and **not** needed for the browse/create/run loop:

- `agents/` — LangGraph project (`langgraph.json`, graphs under `src/agent/core_agents/`),
  served on 2024 when run. Still carries the upstream LangGraph template README.
- `packages/gestalt_code_generator/` — experimental LLM question-generation graphs.
- `packages/gdrive_importer/` — Google Drive indexing utilities.
- `sql_scripts/` — SQL views / normalization prototypes.

## The one request flow that matters

```
POST /questions/{qid}/runtimes/run
  -> QuestionRunTimeService.run()                 backend/question_runtime/service/
     -> QuestionManager loads metadata + files    (Postgres + Storage)
     -> QuestionRunTimeSyncService infers runtimes from server.py / server.js
     -> SandboxClient POSTs to code_sandbox /code_runner/generate
        -> subprocess python3/node executes generate() in a temp dir
     -> TemplateParser substitutes {{params.*}} / {{correct_answers.*}} into HTML
  -> RenderedQuestionBundle { instance, qmeta, question_html, solution_html, quiz_data, logs }
  -> frontend QuestionHtmlToReact maps <pl-*> tags to React components
```

Non-adaptive questions skip the sandbox and return stored HTML as-is.

Secure grading (opt-in) forks this: when runtime output has `secure_grading: true`,
the backend persists `answer_specs` + `correct_answers` + rendered solution in a
`question_instance` row (24 h TTL), strips answers and solution from the response, and
returns only the opaque instance UUID. The client later calls
`POST /questions/{qid}/runtimes/instances/{instance}/grade`, which delegates to the
sandbox's `/grading/grade`.

## Commands

Full stack (preferred):

```bash
docker compose up -d --build
```

Use the **root** `compose.yaml`, not `backend/compose.yaml` (different build context,
may omit files the backend package needs). Root compose sequences: bootstrap DB →
`alembic upgrade head` → import `backend/questions/` bundles → uvicorn `--reload`.

Per-service commands live in each service's CLAUDE.md. Verified on this machine
(2026-08-14): frontend `npm.cmd test` → 43 passing; backend `python -m pytest app_test/unit`
→ 106 passing; sandbox `python -m pytest app_test` → 21 passing.

## Repo-wide invariants

- **Never execute authored question code in the backend or browser.** All `generate()`
  execution goes through `code_sandbox`. All grading goes through the sandbox's
  restricted MathJSON path. Do not add `eval`, `exec`, `sympify` on raw LaTeX, or a
  general formula evaluator anywhere in `backend/` or `frontend/`.
- **Question HTML is a closed tag vocabulary**, not arbitrary HTML. New elements are
  added deliberately in three places (component, component map, attribute mapping).
- **Visual definitions (`circuit.json`, `signal-plot.json`, `block-diagram.json`) are
  explicitly authored geometry.** No auto-layout, no wire routing, no SPICE/simulation.
  Coordinates in the file are the coordinates on screen.
- **The local auth bypass in root `compose.yaml` is development-only.** Settings reject
  it when `ENV=production`. Do not propagate `AUTH_BYPASS_*` / `VITE_AUTH_BYPASS_*` into
  any deployed config.
- Storage paths are prefixes resolved relative to the backend process CWD. Do not
  introduce absolute paths or unvalidated traversal; browser assets go only through
  `GET /questions/{qid}/runtimes/assets/{path}`, which allowlists extensions.

## Environment quirks on this machine

- **No `uv` and no `firebase` CLI installed.** `CODEBASE.md` and the READMEs assume
  both. Use `python -m pytest` / `poetry` instead of `uv run`; Firebase emulator
  workflows are unavailable locally.
- `python` is 3.13.9 and can already `import backend` — a `backend.pth` in site-packages
  points at `backend/src`. `python3` is a **different** interpreter (scoop shim, 3.14.6);
  the sandbox's Python runner shells out to `python3`, so it does not run under the same
  interpreter as the test process.
- PowerShell may block `npm.ps1`; call `npm.cmd`.
- Git will convert LF→CRLF on many tracked files; large "whitespace" diffs (e.g.
  `frontend/src/index.css`) are usually line-ending churn, not real changes.

## Fork context

`origin` is `rjava005/GestaltQuestions`; `upstream` is `lucib3196/GestaltQuestions`.
Work happens on the `Roman` branch. **CI workflows in `.github/workflows/` only trigger
on `main` and `dev`**, so pushes to `Roman` get no CI — run the local suites before
claiming anything is green.

## Known rough edges (verified, not yet fixed)

- `backend/src/backend/api/langchain/langchain.py` hardcodes
  `LANGGRAPH_STREAM_URL = "http://host.docker.internal:2024"` at import time and ignores
  the `LANGGRAPH_STREAM_URL` setting. Settings still *require* that env var to be set or
  startup raises.
- The chat bridge is mounted at `/agents/chat`; `CODEBASE.md` says `/agent/chat`.
- `GET/POST /questions/{qid}/runtimes/` and `/sync-from-files` carry **no auth
  dependency** — runtime configuration for any question is publicly writable. Treat this
  as a bug to be aware of, not a pattern to copy.
- `frontend` production build emits a large-chunk warning (no route-level code splitting).
