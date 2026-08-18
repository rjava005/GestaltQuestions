# Gestalt Questions Codebase Guide

This document is the developer map for the Gestalt Questions repository. It describes the active application, its supporting services, question format, important code paths, local workflows, and the auxiliary research tooling that lives beside the main product.

> Start here for architecture and code navigation. Use the service-specific READMEs for installation background, but prefer the commands in this file when they differ: several older READMEs still reference historical module paths and repository names.

## What the application does

Gestalt Questions is a question-authoring and practice platform built around portable question bundles. A question combines database metadata with files such as HTML, Python or JavaScript generation code, images, and an optional native circuit definition.

The active product supports:

- browsing and rendering published questions;
- adaptive and non-adaptive question instances;
- Python and JavaScript question runtimes executed through a separate sandbox service;
- creator-owned question storage and an advanced file/workspace editor;
- a guided numerical-question creator at `/create`;
- native SVG circuit rendering and guided circuit authoring;
- Firebase-backed authentication, with an explicit development-only bypass;
- question metadata, filtering, copying, download, and runtime configuration;
- experimental chat and LangGraph integrations.

## System architecture

```text
Browser (React/Vite, :5173)
    |
    | REST / Bearer token
    v
Backend API (FastAPI, :8000) -------- PostgreSQL (:5432)
    |                                      |
    |                                      +-- metadata, ownership, runtimes,
    |                                          attempts, users, chat
    |
    +-- Local filesystem or Firebase Storage
    |       question.html, solution.html, server.*, assets, circuit.json
    |
    +-- Code Sandbox (FastAPI, :8080)
    |       isolated Python / JavaScript generate() execution
    |
    +-- Firebase Auth / emulator
    |
    +-- LangGraph service (optional / experimental)
```

The most important request flow is:

1. The frontend requests `POST /questions/{qid}/runtimes/run`.
2. The backend loads question metadata and files.
3. Runtime configuration is inferred/synchronized from `server.py` and `server.js`.
4. Adaptive questions are executed by the code sandbox.
5. The backend renders `{{params.*}}` and `{{correct_answers.*}}` placeholders.
6. The frontend parses the returned HTML and maps supported `pl-*` tags to React components.

## Repository layout

| Path                                                                   | Purpose                                                             | Status                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------- |
| [`frontend/`](frontend/)                                               | React, TypeScript, Vite UI                                          | Active product                                 |
| [`backend/`](backend/)                                                 | FastAPI API, SQLModel data layer, storage and runtime orchestration | Active product                                 |
| [`code_sandbox/`](code_sandbox/)                                       | Separate Python/JavaScript execution API                            | Active product, experimental security boundary |
| [`backend/questions/`](backend/questions/)                             | Checked-in question bundles imported during local startup           | Fixtures/sample content                        |
| [`agents/`](agents/)                                                   | LangGraph agent project                                             | Experimental/auxiliary                         |
| [`packages/gdrive_importer/`](packages/gdrive_importer/)               | Google Drive/content indexing utilities                             | Experimental/auxiliary                         |
| [`packages/gestalt_code_generator/`](packages/gestalt_code_generator/) | LLM-based question/runtime generation graphs and prompts            | Experimental/auxiliary                         |
| [`sql_scripts/`](sql_scripts/)                                         | SQL view and data-normalization utilities                           | Maintenance/prototypes                         |
| [`.github/workflows/`](.github/workflows/)   2                          | Frontend and backend CI                                             | Active automation                              |
| [`compose.yaml`](compose.yaml)                                         | Primary local stack                                                 | Preferred Docker entry point                   |
| [`compose.dev.yaml`](compose.dev.yaml)                                 | Older/alternate development stack                                   | Check before use                               |
| [`firebase.json`](firebase.json)                                       | Auth/storage emulator ports and rules                               | Local/CI support                               |

## Quick start

### Docker Compose (recommended)

From the repository root:

```bash
docker compose up -d --build
```

Services:

| Service            | URL                          |
| ------------------ | ---------------------------- |
| Frontend           | <http://localhost:5173>      |
| Backend API        | <http://localhost:8000>      |
| Swagger UI         | <http://localhost:8000/docs> |
| Code sandbox       | <http://localhost:8080>      |
| Sandbox Swagger UI | <http://localhost:8080/docs> |
| PostgreSQL         | `localhost:5432`             |

Useful commands:

```bash
docker compose ps
docker compose logs -f server
docker compose logs -f frontend
docker compose restart server frontend
docker compose down
```

The root Compose startup sequence for the backend is intentional:

1. bootstrap an empty database;
2. apply Alembic migrations;
3. import checked-in question bundles;
4. start Uvicorn with reload enabled.

Use the root Compose file. The standalone [`backend/compose.yaml`](backend/compose.yaml) has a different build context and may not include files required by the backend package build.

### Manual frontend

```bash
cd frontend
npm install
npm run dev
```

Other frontend commands:

```bash
npm test
npm run build
npm run lint
```

On Windows PowerShell systems that block `npm.ps1`, invoke `npm.cmd` directly.

### Manual backend

The backend is a `uv`/`pyproject.toml` project and currently targets Python 3.11+ (CI covers 3.12 and 3.13).

```bash
cd backend
uv sync
uv run uvicorn src.main:app --reload --port 8000
```

Run migrations and tests with:

```bash
uv run alembic upgrade head
uv run pytest app_test/unit
uv run pytest app_test/integration
uv run ruff check src app_test
```

Firebase-dependent backend tests expect the emulators described in [`firebase.json`](firebase.json). Start them from the repository root with:

```bash
firebase emulators:start
```

## Local authentication

### Normal mode

The frontend uses Firebase client authentication. API requests obtain an ID token and send it as `Authorization: Bearer <token>`. The backend verifies it in [`backend/src/backend/api/deps.py`](backend/src/backend/api/deps.py), then uses the Firebase `user_id` to load the local SQL user.

Account creation is coordinated by [`UserManager`](backend/src/backend/auth/services/user_manager.py): it creates the SQL user, creates the Firebase Auth user, assigns the default role/institution, and rolls back the SQL row if creation fails.

For local Firebase emulation, remember that `127.0.0.1` inside a container refers to that container. Use a reachable emulator host or the development bypass below.

### Development bypass

The primary [`compose.yaml`](compose.yaml) currently enables a local bypass so question creation can be tested without Firebase:

```env
AUTH_BYPASS_ENABLED=true
AUTH_BYPASS_USER_ID=00000000-0000-4000-8000-000000000001
AUTH_BYPASS_TOKEN=local-dev-bypass

VITE_AUTH_BYPASS_ENABLED=true
VITE_AUTH_BYPASS_TOKEN=local-dev-bypass
```

When enabled:

- backend startup seeds a fixed `local_author` SQL user, developer role, and developer profile;
- the frontend exposes that identity through the normal auth context;
- the frontend and backend must use the same bypass token;
- the bypass is rejected when the backend environment is production;
- settings default to bypass disabled outside the explicit Compose configuration.

Do not copy these flags into a deployed environment. To return to Firebase locally, remove or set both bypass-enabled variables to `false`, configure a reachable Firebase Auth service, and recreate the frontend/backend containers.

## Frontend architecture

The frontend is React 19 + TypeScript + Vite. Styling uses Tailwind CSS utilities and CSS theme variables. State is split between React contexts and Zustand stores.

### Entry points and routing

- [`frontend/src/main.tsx`](frontend/src/main.tsx) initializes MathJax, the error boundary, auth provider, and application.
- [`frontend/src/App.tsx`](frontend/src/App.tsx) is the route table.
- [`frontend/src/layouts/AppLayout.tsx`](frontend/src/layouts/AppLayout.tsx) provides the navigation shell.
- [`frontend/src/features/NavBar/constant.tsx`](frontend/src/features/NavBar/constant.tsx) defines role-aware top-level navigation.
- [`frontend/src/features/Auth/RequireRole.tsx`](frontend/src/features/Auth/RequireRole.tsx) handles login and role guards.

Important routes:

| Route                                   | Purpose                                | Access                    |
| --------------------------------------- | -------------------------------------- | ------------------------- |
| `/`                                     | Home                                   | Public                    |
| `/login`                                | Login/signup                           | Public                    |
| `/questions`                            | Browse questions                       | Public                    |
| `/questions/:qid`                       | Render a question                      | Public                    |
| `/create`                               | Guided numerical/circuit creator       | Admin, developer, teacher |
| `/question_builder`                     | Owned-question list and advanced tools | Admin, developer, teacher |
| `/question_builder/questions/:qid/edit` | Question workspace                     | Admin, developer, teacher |

The legacy `/question_builder/questions/new` route redirects to `/create`.

### Major feature folders

| Folder                                                                     | Responsibility                                                                          |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`features/Auth`](frontend/src/features/Auth/)                             | Firebase/local-bypass auth state, role guard, login/signup UI                           |
| [`features/GuidedCreator`](frontend/src/features/GuidedCreator/)           | Guided form, validation, restricted formula parser, artifact generation, circuit editor |
| [`features/QuestionBuilder`](frontend/src/features/QuestionBuilder/)       | Creator APIs, owned-question hooks, builder configuration                               |
| [`features/QuestionWorkspace`](frontend/src/features/QuestionWorkspace/)   | Advanced metadata/editor/preview workspace                                              |
| [`features/QuestionCodeEditor`](frontend/src/features/QuestionCodeEditor/) | Question file editing                                                                   |
| [`features/QuestionEngine`](frontend/src/features/QuestionEngine/)         | Runtime state, HTML-to-React rendering, inputs, panels, circuit renderer                |
| [`features/QuestionMetadata`](frontend/src/features/QuestionMetadata/)     | Metadata editing                                                                        |
| [`features/QuestionTables`](frontend/src/features/QuestionTables/)         | Search/list tables and filters                                                          |
| [`features/Chat`](frontend/src/features/Chat/)                             | Experimental assistant/chat UI                                                          |
| [`services/`](frontend/src/services/)                                      | Axios client and API wrappers                                                           |
| [`types/`](frontend/src/types/)                                            | Shared frontend request/response/file types                                             |

### Guided creator

[`GuidedQuestionCreator.tsx`](frontend/src/features/GuidedCreator/GuidedQuestionCreator.tsx) owns a single draft containing question text, solution text, parameters, numeric answers, and optional circuit state.

Key implementation files:

- [`types.ts`](frontend/src/features/GuidedCreator/types.ts): draft types;
- [`formula.ts`](frontend/src/features/GuidedCreator/formula.ts): tokenizer, parser, references, Python/JavaScript emitters;
- [`generate.ts`](frontend/src/features/GuidedCreator/generate.ts): validation, safe Markdown conversion, HTML/runtime generation;
- [`CircuitEditor.tsx`](frontend/src/features/GuidedCreator/CircuitEditor.tsx): SVG grid authoring UI.

The formula language deliberately supports only numeric literals, parameter identifiers, parentheses, `+`, `-`, `*`, `/`, `^`, `pi`, `e`, and approved single-argument math functions. Do not replace this parser with `eval` or general-purpose JavaScript/Python evaluation.

Saving sends one multipart request through `POST /developer/questions/with-files`; successful saves navigate to the advanced workspace.

### Question rendering

The backend returns rendered question/solution HTML plus `quiz_data`. [`QuestionHtmlToReact.tsx`](frontend/src/features/QuestionEngine/render/QuestionHtmlToReact.tsx) parses that HTML and maps approved tags in [`questionComponentMap.tsx`](frontend/src/features/QuestionEngine/mappings/questionComponentMap.tsx).

Supported tags currently include:

- `pl-question-panel`
- `pl-solution-panel`
- `pl-number-input`
- `pl-multiple-choice`, `pl-checkbox`, `pl-answer`
- `pl-figure`
- `pl-circuit`
- `pl-hint`
- `pl-derivation-container`, `pl-derivation-step`

Adding a new question element usually requires:

1. a React component under `QuestionEngine/render/components`;
2. its prop type;
3. a component-map entry;
4. raw attribute conversion in `TagAttributeMapping`;
5. rendering tests.

### Circuit system

Circuit types and validation live in [`circuitDefinition.ts`](frontend/src/features/QuestionEngine/render/components/content/circuitDefinition.ts). Rendering lives in [`PLCircuit.tsx`](frontend/src/features/QuestionEngine/render/components/content/PLCircuit.tsx), and the guided editor reuses its exported `CircuitSvg` so authoring and question rendering share symbols.

Version 1 stores one explicit scene. Version 2, supported by the renderer but not emitted by the guided prototype, selects among authored scenes using a parameter path.

A scene contains:

- an SVG `viewBox`;
- a required accessible `ariaLabel`;
- wire polylines;
- typed elements (resistor, capacitor, inductor, voltage source, op amp, ground, terminal);
- optional annotations and parameter value bindings.

The editor snaps to a 20-unit grid. It does not provide simulation, automatic routing, SPICE/netlist output, or undo history.

## Backend architecture

The backend is FastAPI + SQLModel/SQLAlchemy + Pydantic. [`backend/src/main.py`](backend/src/main.py) builds the application, initializes Firebase, seeds reference data, and includes all routers from [`backend/api/__init__.py`](backend/src/backend/api/__init__.py).

### Domain packages

| Package              | Responsibility                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `api`                | HTTP routers and dependency injection                                                      |
| `auth`               | Users, roles, institutions, developer profiles, Firebase coordination                      |
| `question`           | Question metadata models, schemas, queries, topics/types                                   |
| `question_manager`   | Metadata + file lifecycle, ownership checks, atomic create/copy/delete behavior            |
| `question_runtime`   | Runtime models, language/default resolution, file synchronization, execution orchestration |
| `question_rendering` | Server-side template parsing/rendering                                                     |
| `question_attempt`   | Attempt data and quiz answer schemas                                                       |
| `question_views`     | Database-view-backed question table queries                                                |
| `storage`            | Abstract storage interface, local filesystem, Firebase storage, ZIP helpers                |
| `sandbox_client`     | HTTP client for the code sandbox                                                           |
| `chat`               | Threads/messages and LangGraph-facing chat services                                        |
| `database`           | Engine/session setup and empty-database bootstrap                                          |
| `core`               | Settings, Firebase initialization, logging, shared application setup                       |

### Data model

Principal SQL tables are:

- `User`, `Role`, `UserRoleLink`, `Institution`, `DeveloperProfile`;
- `Question`, `Topic`, `QuestionType`, and relationship link tables;
- `QuestionRunTime`;
- `QuestionAttempt`;
- `Thread` and `Message`.

Question files are not stored as database blobs. `Question.storage_path` points to the local or cloud storage prefix. Runtime records describe how the sandbox should invoke code found in those files.

Schema changes use Alembic under [`backend/migrations/`](backend/migrations/). Create a migration rather than relying on `SQLModel.metadata.create_all` for an existing database.

### API groups

Use Swagger at `/docs` for the authoritative live schema. Major route prefixes are:

| Prefix                            | Responsibility                                        |
| --------------------------------- | ----------------------------------------------------- |
| `/users`                          | Signup, current user, role/institution administration |
| `/users/dev`                      | Developer/author profile operations                   |
| `/developer/questions`            | Authenticated owned-question CRUD and file operations |
| `/developer/questions/with-files` | Atomic guided-question multipart creation             |
| `/questions`                      | Public question retrieval/filtering                   |
| `/questions/{qid}/runtimes`       | Runtime configuration, execution, safe assets         |
| `/question-tables`                | Table/search endpoints                                |
| `/threads`                        | Chat threads and messages                             |
| `/agent/chat`                     | LangGraph chat bridge                                 |
| `/health`                         | Liveness, database, Firebase, settings checks         |

The `with-files` endpoint accepts exactly:

- `question.html`
- `solution.html`
- `server.py`
- `server.js`
- optional `circuit.json`

Creation uses the creator profile's storage prefix and a sanitized title plus a short question ID. The question manager rolls back the database record and files on initial-file failure; creator assignment failure also triggers cleanup.

### Authorization and ownership

Question-author roles are admin, developer, and teacher. These roles can create and manage their own questions; this does not grant unrelated administration privileges.

Ownership checks flow through `DeveloperQuestionService.require_question_control`. When adding a new owned-question endpoint, use this service rather than calling `QuestionManager` directly.

### Storage

[`Storage`](backend/src/backend/storage/services/base.py) defines the storage abstraction. Implementations include local filesystem and Firebase/Google Cloud storage.

`STORAGE_SERVICE=local` is used by the primary Compose stack. Local paths resolve relative to the backend process working directory, so avoid introducing absolute paths or unvalidated traversal. Browser-facing assets are served only through the safe runtime asset endpoint, which restricts extensions and rejects traversal.

## Question bundle contract

A typical question directory contains:

```text
question-directory/
├── info.json          # fixture import metadata (checked-in bundles)
├── question.html      # required rendered content and input elements
├── solution.html      # optional generally; required by guided creator
├── server.py          # optional Python adaptive runtime
├── server.js          # optional JavaScript adaptive runtime
├── circuit.json       # optional native circuit scene
└── images/assets      # optional display assets
```

### Adaptive runtime interface

Python runtimes expose `generate(...)`. JavaScript runtimes export `generate`, normally with CommonJS:

```javascript
module.exports = { generate };
```

The output contract is:

```json
{
  "params": { "name": 10 },
  "correct_answers": { "answer": 42 },
  "nDigits": 3,
  "sigfigs": 3
}
```

`params` supplies question/solution placeholders and circuit bindings. `correct_answers` supplies grading inputs and solution placeholders. Extra runtime data may be returned, but these two maps are the core contract.

Non-adaptive questions skip sandbox execution and return their stored HTML directly.

## Code sandbox

The sandbox service is a separate FastAPI application at port 8080. Its HTTP routes are in [`code_sandbox/src/web/code_running.py`](code_sandbox/src/web/code_running.py); language-specific runners are under [`code_sandbox/src/services/code_runner/`](code_sandbox/src/services/code_runner/).

The backend submits a runtime entry file, language, function name, question files, and optional generation context. The sandbox returns output plus captured logs.

Treat this service as a security-sensitive boundary. Keep execution limits, path validation, dependency availability, and process isolation in mind when expanding runtime capabilities. Do not execute authored runtime files directly in the frontend or backend API process.

## Fixture import and database startup

[`backend/src/backend/database/bootstrap.py`](backend/src/backend/database/bootstrap.py) initializes the current schema only when the database is empty and establishes an Alembic baseline.

[`backend/src/backend/question/import_bundles.py`](backend/src/backend/question/import_bundles.py) imports question directories from [`backend/questions/`](backend/questions/) and synchronizes their runtime records. Startup is designed to be idempotent: existing imported questions are reused rather than duplicated.

The database-backed question-table views are maintained through migrations and SQL in [`sql_scripts/`](sql_scripts/).

## Tests and quality checks

### Frontend

```bash
cd frontend
npm test
npm run build
npm run lint
```

Vitest configuration is in [`frontend/vitest.config.ts`](frontend/vitest.config.ts), with shared setup under [`frontend/src/test/`](frontend/src/test/).

High-value test areas include:

- guided creator validation/artifact generation;
- circuit definition validation and renderer behavior;
- question runtime API handling;
- QuestionEngine instance state.

### Backend

```bash
cd backend
uv run pytest app_test/unit
uv run pytest app_test/integration
uv run pytest app_test
uv run ruff check src app_test
```

Some runtime parity tests invoke both Python and Node. Run them in an environment that has both executables; the Python-only backend container does not currently include Node.

### Sandbox

```bash
cd code_sandbox
pytest app_test
```

### CI

GitHub Actions cover frontend builds and backend unit/integration/full suites. Backend CI starts Firebase emulators and tests Python 3.12/3.13. Review [`.github/workflows/`](.github/workflows/) and the custom actions under [`.github/actions/`](.github/actions/) when local and CI behavior differ.

## Environment variables

Do not commit real credentials. The most relevant variables are:

### Backend

| Variable                      | Purpose                                                                |
| ----------------------------- | ---------------------------------------------------------------------- |
| `MODE` / `ENV`                | Environment selection; settings primarily model dev/testing/production |
| `DATABASE_URL`                | SQLAlchemy/PostgreSQL connection                                       |
| `BACKEND_CORS_ORIGINS`        | Comma-separated allowed frontend origins                               |
| `STORAGE_SERVICE`             | `local` or `cloud`                                                     |
| `FIREBASE_CRED`               | Credential JSON/path, interpreted by environment                       |
| `STORAGE_BUCKET`              | Firebase/Google storage bucket                                         |
| `FIREBASE_AUTH_EMULATOR_HOST` | Firebase Auth emulator address                                         |
| `STORAGE_EMULATOR_HOST`       | Firebase Storage emulator address                                      |
| `SANDBOX_URL`                 | Code sandbox base URL                                                  |
| `LANGGRAPH_STREAM_URL`        | LangGraph deployment URL                                               |
| `LANGSMITH_API_KEY`           | LangSmith key where required                                           |
| `AUTH_BYPASS_ENABLED`         | Development-only local auth switch                                     |
| `AUTH_BYPASS_USER_ID`         | Fixed seeded local user UUID                                           |
| `AUTH_BYPASS_TOKEN`           | Token accepted only in bypass mode                                     |

### Frontend

| Variable                           | Purpose                                              |
| ---------------------------------- | ---------------------------------------------------- |
| `VITE_API_URL`                     | Backend API URL                                      |
| `VITE_FIREBASE_*`                  | Firebase client configuration                        |
| `VITE_MODE`                        | Enables client emulator connection when set to `dev` |
| `VITE_FIREBASE_AUTH_EMULATOR_HOST` | Browser-reachable Auth emulator URL                  |
| `VITE_AUTH_BYPASS_ENABLED`         | Development-only frontend bypass switch              |
| `VITE_AUTH_BYPASS_TOKEN`           | Must match backend bypass token                      |

Vite variables are injected when the dev server starts. Recreate/restart the frontend container after changing them.

## Where to make common changes

| Goal                                     | Start here                                                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add/change a page route                  | [`frontend/src/App.tsx`](frontend/src/App.tsx)                                                                                                                   |
| Change top navigation or role visibility | [`frontend/src/features/NavBar/constant.tsx`](frontend/src/features/NavBar/constant.tsx)                                                                         |
| Change auth behavior                     | [`frontend/src/features/Auth/AuthContext.tsx`](frontend/src/features/Auth/AuthContext.tsx), [`backend/src/backend/api/deps.py`](backend/src/backend/api/deps.py) |
| Add an API router                        | [`backend/src/backend/api/`](backend/src/backend/api/), then register it in `api/__init__.py`                                                                    |
| Add/change a database table              | Domain `model.py`, schema/service, then Alembic migration                                                                                                        |
| Change question CRUD/files               | `question_manager/services/manager.py` and `developer_manager.py`                                                                                                |
| Change runtime execution                 | `question_runtime/service/`, `sandbox_client/`, and `code_sandbox/`                                                                                              |
| Add a `pl-*` component                   | `QuestionEngine/render/components` plus `questionComponentMap.tsx`                                                                                               |
| Change guided artifact output            | [`frontend/src/features/GuidedCreator/generate.ts`](frontend/src/features/GuidedCreator/generate.ts)                                                             |
| Change formula syntax                    | [`frontend/src/features/GuidedCreator/formula.ts`](frontend/src/features/GuidedCreator/formula.ts)                                                               |
| Add a circuit symbol/schema field        | `circuitDefinition.ts`, `PLCircuit.tsx`, `CircuitEditor.tsx`, and tests                                                                                          |
| Add fixture questions                    | [`backend/questions/`](backend/questions/) and importer-compatible `info.json`                                                                                   |

## Auxiliary projects

### `agents/`

A separate LangGraph project with dynamic model/agent experiments. Its primary documentation is [`agents/README.md`](agents/README.md) and configuration is [`agents/langgraph.json`](agents/langgraph.json). It is not required for the core question browse/create/runtime loop unless chat/agent features are being developed.

### `packages/gdrive_importer/`

Utilities for indexing Google Drive content and analyzing imported HTML. This package is sparsely documented; read its `pyproject.toml` and `src/gdrive_importer/main.py` before use.

### `packages/gestalt_code_generator/`

An experimental LLM/LangGraph pipeline for document loading, question server generation, image generation, and iterative code generation. Prompts, graphs, model schemas, and a small test suite are included. It is separate from the deterministic guided creator in the frontend.

## Known development caveats

- The root Compose stack currently enables the local auth bypass. This is convenient for creator testing but should never be treated as a production authentication path.
- Firebase emulator hosts must be reachable from the process using them. Container-local `127.0.0.1` does not reach an emulator on the host.
- The Python-only backend container does not include Node, so cross-language parity tests that spawn `node` must run on the host/CI or in a combined toolchain image.
- Some older READMEs and the alternate Compose file contain historical commands or paths. Prefer this guide, the root Compose file, and live Swagger output.
- The frontend production build currently reports a large-chunk warning. It does not fail the build, but route-level code splitting would improve load size.
- Question HTML is a controlled custom-element format. Adding arbitrary HTML execution or a general formula evaluator would materially change the security model.
- The circuit editor exports authored geometry, not an electrical simulation model.

## Useful resources

Project-local resources:

- [Root README](README.md)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Sandbox README](code_sandbox/README.md)
- [Circuit authoring overview](README.md#circuit-question-authoring)
- [API documentation when running locally](http://localhost:8000/docs)
- [Sandbox API documentation when running locally](http://localhost:8080/docs)

Technology documentation:

- [FastAPI](https://fastapi.tiangolo.com/)
- [Pydantic](https://docs.pydantic.dev/)
- [SQLModel](https://sqlmodel.tiangolo.com/)
- [Alembic](https://alembic.sqlalchemy.org/)
- [React](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [Vite](https://vite.dev/)
- [Vitest](https://vitest.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://zustand.docs.pmnd.rs/)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Docker Compose](https://docs.docker.com/compose/)
- [LangGraph](https://docs.langchain.com/oss/python/langgraph/overview)
- [MathJax](https://docs.mathjax.org/)

## Signal/control framework

Signal plots and block diagrams explicitly fill SVG text with the theme-aware
`--color-text` token. Version-1 signal `shadedRegions` accept optional `traceId`
and `baseline` fields: `traceId` fills under a referenced continuous/piecewise
trace between `x1` and `x2` (with interpolated boundary values), while omitting
it preserves rectangular `y1`/`y2` regions; `baseline` defaults to zero.
Block-diagram answer slots use their authored `width` and `height` as the full
accent-outlined block dimensions, with a visible label and an inset answer field.
Their centers remain the explicit `at` coordinates; no automatic layout occurs.

`code_sandbox/src/gestalt_signal_systems` is the shared numerical boundary.
Its signal, control, and serialization modules produce bounded, finite visual
data. The grading module recursively validates slot-specific MathJSON before
constructing SymPy expressions directly; submitted LaTeX is never parsed.
Depth/node/sample limits and the sandbox process/request timeouts bound work.

Secure adaptive runs are coordinated by `QuestionRunTimeService` and
`QuestionInstanceDB`. `question_instance` rows contain an opaque UUID, question
foreign key, private grading JSON, and creation/expiry timestamps. Secure runs
strip answers and solutions; grade calls verify the question and 24-hour expiry,
delegate to the sandbox, and reveal the formatted solution. Startup and normal
traffic remove stale rows. Static and legacy adaptive output keeps the existing
`correct_answers` contract.

QuestionEngine registers `pl-math-input`, `pl-signal-plot`, and
`pl-block-diagram`. Assets use the same validated local/Firebase delivery path
as circuits. SVG scenes are responsive/accessibile, while answer controls are
semantic HTML aligned over explicit authored coordinates. The existing Zustand
question store holds both answer state and secure per-slot grade results, so
public rendering and advanced workspace preview use the same implementation.

## Suggested onboarding path

1. Start the root Compose stack and confirm `/health/live`, the frontend, and Swagger.
2. Browse a fixture question and trace `QuestionRuntimeApi` through `QuestionRunTimeService` to the sandbox.
3. Create a small constant numerical question at `/create`.
4. Add a parameter and compare the generated Python/JavaScript runtimes in the workspace.
5. Add a simple resistor circuit and inspect the saved `circuit.json`.
6. Run frontend tests/build and backend unit tests before making architectural changes.

That sequence touches the core abstractions—auth, ownership, storage, runtimes, rendering, and circuits—without requiring the optional agent packages.
