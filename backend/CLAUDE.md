# CLAUDE.md — backend (FastAPI API)

FastAPI + SQLModel/SQLAlchemy + Pydantic v2. Owns question metadata, ownership, file
storage orchestration, runtime resolution, template rendering, secure-grading instances,
auth, and chat threads. It **does not execute question code** — that is `code_sandbox/`.

Package root is `src/backend/`; the ASGI app is `src/main.py:app`.

## Commands (this machine — no `uv` installed)

```bash
python -m pytest app_test/unit          # 106 passing, ~2m15s
```

```bash
python -m pytest app_test/integration
```

```bash
python -m pytest app_test
```

```bash
python -m ruff check src app_test
```

`python` (3.13.9) already resolves `import backend` via a `backend.pth` in site-packages
pointing at `backend/src`, so pytest works without a venv here. Docs elsewhere say
`uv run …`; `uv` is not installed — substitute `python -m` or `poetry run`.

Serving locally: `python -m uvicorn src.main:app --reload --port 8000`, or use root
`docker compose up`. Swagger at `/docs` is the authoritative live schema.

Migrations: `python -m alembic upgrade head` (config in `alembic.ini`, versions in
`migrations/versions/`). **Add a migration for any model change** — `create_all` only
covers the empty-database bootstrap path.

Integration/storage tests expect Firebase emulators (`firebase.json` at repo root);
the `firebase` CLI is not installed here, so those paths fail locally.

## Layout

| Package              | Responsibility                                                              |
| -------------------- | --------------------------------------------------------------------------- |
| `api/`               | Routers + DI. `api/deps.py` is the single dependency-wiring file.            |
| `auth/`              | User/Role/Institution/DeveloperProfile models, Firebase coordination         |
| `question/`          | Question/Topic/QuestionType models, schemas, queries, fixture import         |
| `question_manager/`  | Metadata + file lifecycle, ownership checks, atomic create/copy/delete       |
| `question_runtime/`  | Runtime records, language resolution, file sync, execution, secure instances |
| `question_rendering/`| `TemplateParser` — regex substitution of `{{params.*}}`/`{{correct_answers.*}}` |
| `question_attempt/`  | Attempt records and `QuizData` schema                                       |
| `question_views/`    | DB-view-backed table queries                                                |
| `storage/`           | `Storage` ABC + local filesystem and Firebase implementations, zip helpers   |
| `sandbox_client/`    | HTTP client for `code_sandbox`                                              |
| `chat/`              | Threads/messages                                                            |
| `database/`          | Engine/session + empty-DB bootstrap                                         |
| `core/`              | Settings, Firebase init, logging                                            |

## Conventions

- **Every dependency is declared in `api/deps.py`** as a `Annotated[T, Depends(...)]`
  alias (`SessionDep`, `StorageDependency`, `QuestionRuntimeServiceDependency`, …).
  Routers import the alias; they never construct services inline.
- **Routers stay thin**: validate, delegate to a service, translate exceptions into
  `HTTPException`. Business logic lives in `*/services/`.
- **Owned-question endpoints go through `DeveloperQuestionService`
  (`require_question_control`), never `QuestionManager` directly** — that service is
  where the ownership check lives.
- Each domain package has its own `exceptions.py` deriving from a package base
  (e.g. `QuestionManagerException`). Services raise domain exceptions; routers map them.
- `QuestionManager` operations are **transactional by hand**: create rolls back the DB
  row and any files written in that call; delete snapshots the storage dir first and
  restores it if the DB delete fails. Preserve that pattern when adding operations.
- Ruff config in `pyproject.toml` is strict (`ANN`, `ARG`, `RET`, `PTH`, `SIM`, `B`, …),
  line length 88, target py312.

## Settings (`core/config.py`) — read before touching env

`AppSettings` is a `pydantic-settings` model resolved once via `get_settings()` (lru_cache).
Its validators **raise at import/startup**, which is the usual cause of "backend won't
boot":

- `DATABASE_URL` must be set (aliases: `POSTGRES_URL`, `database_url`).
- `FIREBASE_CRED` must be set. Outside production it must be a path (relative to
  `PROJECT_ROOT`) to an existing JSON file; in production it is parsed as inline JSON.
- Outside production, at least one of `FIREBASE_AUTH_EMULATOR_HOST` /
  `STORAGE_EMULATOR_HOST` must be set.
- `LANGGRAPH_STREAM_URL` is **required in every environment** even though
  `api/langchain/langchain.py` hardcodes its own URL and ignores the setting.
- `AUTH_BYPASS_ENABLED=true` with `ENV=production` is rejected.
- Note `ENV` reads from the `MODE`/`mode` env var (`validation_alias`), while the
  `.env` file chosen at import time keys off `ENV`. Compose sets `MODE`.

## Auth

`get_firebase_token` in `api/deps.py` is the gate. Normal mode verifies the Firebase ID
token from `Authorization: Bearer`. Bypass mode (`AUTH_BYPASS_ENABLED`) accepts exactly
`AUTH_BYPASS_TOKEN` and synthesizes `{user_id: AUTH_BYPASS_USER_ID, auth_bypass: true}`.
`main.py:seed_database` seeds that fixed user + developer role + a
`local_authors/{uuid}/` DeveloperProfile at startup when bypass is on.

Question-author roles: `admin`, `developer`, `teacher`.

## Runtime execution and secure grading

`QuestionRunTimeService.run()` (`question_runtime/service/question_runtime.py`) is the
core path — see the flow diagram in the root `CLAUDE.md`. Details worth knowing:

- Runtime records are **inferred from files on every run** via
  `QuestionRunTimeSyncService.sync_from_files`, except for runtimes whose
  `source == MANUAL` (those are preserved unless `overwrite_manual=True`).
- `TemplateParser` only substitutes paths under `params.` and `correct_answers.`;
  unknown tokens are left verbatim by default (`keep_unknown=True`, `strict=False`).
- Secure path: output `secure_grading: true` requires `answer_specs` **and**
  `correct_answers` dicts, or the run fails. The instance row holds
  `{answer_specs, correct_answers, solution_html}`; the response drops `correct_answers`
  and `solution_html` entirely and carries the instance UUID.
- `grade()` verifies the instance belongs to the question, returns **410** past
  `expires_at` (24 h), delegates to the sandbox, then reveals `solution_html`.
- Expired instances are swept at startup and on each secure run/grade.

## Question bundles

`backend/questions/` holds checked-in fixture bundles imported at startup by
`question/import_bundles.py` (idempotent — existing imports are reused). `.gitignore`
excludes `backend/questions/*` except an explicit allowlist, so **a new fixture bundle
needs a `!backend/questions/<name>/` entry in the root `.gitignore`** or it will not be
committed.

Bundle contract: `info.json` (import metadata), `question.html` (required),
`solution.html`, `server.py` / `server.js` (adaptive), `circuit.json` /
`signal-plot.json` / `block-diagram.json`, image assets.

`generate()` returns `{"params": {...}, "correct_answers": {...}}` plus optional
`nDigits`/`sigfigs`, or the secure form (`secure_grading`, `answer_specs`,
`correct_answers`).

Guided creation (`POST /developer/questions/with-files`) accepts **exactly**
`question.html`, `solution.html`, `server.py`, `server.js`, and optionally `circuit.json`
— enforced in `api/question_manager/question_manager.py`.

## Route map

| Prefix                            | Auth                        |
| --------------------------------- | --------------------------- |
| `/users`, `/users/dev`            | bearer                      |
| `/developer/questions/**`         | bearer + ownership          |
| `/questions` (read/filter)        | public                      |
| `/questions/{qid}/runtimes/run`   | public                      |
| `/questions/{qid}/runtimes/instances/{id}/grade` | public (instance UUID is the capability) |
| `/questions/{qid}/runtimes/assets/{path}` | public, extension-allowlisted |
| `/questions/{qid}/runtimes/` (list/create/sync) | **no auth — known gap** |
| `/question-tables/*`, `/threads/*`, `/agents/chat` | mixed |
| `/health/{live,db,firebase,settings}` | public                  |

## Tests

`app_test/{unit,integration,web}` with shared factories/fixtures in `app_test/shared/`.
`conftest.py` gives every test a fresh temp-file SQLite engine and drops/recreates all
tables between tests (`_clean_db` autouse). `pytest.ini` sets `asyncio_mode = strict`,
so async tests need explicit `@pytest.mark.asyncio`.

Some parity tests spawn `node`; the Python-only backend container has no Node, so run
those on the host.
