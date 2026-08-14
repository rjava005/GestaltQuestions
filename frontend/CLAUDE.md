# CLAUDE.md — frontend (React + Vite)

React 19 + TypeScript + Vite 7, Tailwind 4 utilities over CSS custom properties, state
split between React context (auth) and Zustand stores (question instance). Talks to the
backend over REST with a Firebase ID token (or the dev bypass token) as
`Authorization: Bearer`.

## Commands

```bash
npm.cmd test
```

```bash
npm.cmd run dev
```

```bash
npm.cmd run build
```

```bash
npm.cmd run lint
```

Use `npm.cmd` on Windows — PowerShell execution policy commonly blocks `npm.ps1`.
Vitest (jsdom, setup in `src/test/setup.ts`) currently runs **43 tests across 11 files,
all passing** (~17 s). `build` runs `tsc -b` first, so type errors fail the build.

## Structure

- `src/main.tsx` — MathJax config, error boundary, `AuthProvider`, app mount.
- `src/App.tsx` — the entire route table (see below).
- `src/layouts/AppLayout.tsx` — nav shell; `features/NavBar/constant.tsx` holds
  role-aware nav entries.
- `src/features/<Feature>/` — feature-scoped components, hooks, stores, api wrappers.
- `src/services/` — axios client (`client.ts`) and per-domain API classes.
- `src/config/apiConfig.ts` — `VITE_API_URL` (default `http://localhost:8000`) and
  `VITE_AI_URL` (default `http://localhost:2024`).
- `src/features_temp/` — parked/experimental; not wired into routes.

Routes: `/`, `/login`, `/account`, `/questions`, `/questions/:qid` are public;
`/create`, `/question_builder`, `/question_builder/questions/:qid/edit`,
`/question_builder/playground`, `/question_builder/chat` are gated by
`RequireRole allow={["admin","developer","teacher"]}`. `questions/new` redirects to
`/create`. Unknown paths redirect to `/`.

## QuestionEngine — the rendering pipeline

`features/QuestionEngine/` is the heart of the app.

```
useRunQuestion(qid, language, refreshKey, previousCircuitVariant)   runtime/
  -> QuestionRuntimeApi.runQuestion()                              services/QuestionRuntime/
  -> store.setRunTimeContent(payload)                              instance/stores.ts
QuestionRenderShell -> QuestionBody -> QuestionHTMLToReact(html)    render/
  -> html-react-parser walks the DOM
  -> TagAttributeMapping[tag](rawAttrs) -> props                    mappings/
  -> ComponentMap[tag] -> React component                          render/components/
```

**Adding a `pl-*` element takes four coordinated edits** (all in
`features/QuestionEngine/`):

1. the component under `render/components/{content,inputs,math,panels,visuals}/`;
2. export it + its `Props` type from `render/components/index.ts`;
3. add the tag to `ValidComponents`, `TagRegistry`, and `ComponentMap` in
   `mappings/questionComponentMap.tsx`;
4. add a `TagAttributeMapping` entry converting raw kebab-case HTML attributes to props.

Miss step 3 or 4 and the tag silently renders as nothing — `TransformTag` returns
`undefined` for unregistered tags and `HandleTags` returns `null`.

Currently registered: `pl-question-panel`, `pl-solution-panel`, `pl-number-input`,
`pl-multiple-choice`, `pl-checkbox`, `pl-answer`, `pl-math-input`, `pl-figure`,
`pl-hint`, `pl-derivation-container`, `pl-derivation-step`, `pl-circuit`,
`pl-signal-plot`, `pl-block-diagram`.

Attribute names are inconsistent by design (they mirror authored HTML): number inputs
read `answers-name`, math inputs read `answer-name` (with `answers-name` fallback), and
most components accept both `class` and `classname`. Check the existing mapping before
inventing a new attribute spelling.

## Question instance store

`instance/stores.ts` creates a per-question Zustand store (via `createStore` + context
in `instance/context.tsx`, consumed with `useQuestionInstance`). It holds the run
payload, per-slot `answers`, `hasSubmitted`, `showSolution`, `refreshKey`, and secure
`grading` results.

`submitAnswers()` branches on `quiz_data.secure_grading`:

- **false/absent** — legacy path, just flips `hasSubmitted`; correctness is compared
  client-side against `correct_answers` already present in `quiz_data`.
- **true** — POSTs to the grade endpoint with the instance UUID, stores per-slot grades,
  and only then receives `solution_html`. `hasSubmitted` is set only when the overall
  status is `correct`.

`setRefreshKey()` ("New Variant") bumps `refreshKey` and captures the current
`params.circuitVariant` as `previousCircuitVariant`, which is echoed back to the backend
so the next generation can pick a different topology.

## Visual definitions

`circuitDefinition.ts`, `signalPlotDefinition.ts`, `blockDiagramDefinition.ts` are the
validators/types for the authored JSON scenes; `PLCircuit.tsx`, `PLSignalPlot.tsx`,
`PLBlockDiagram.tsx` render them; `useQuestionAsset.ts` fetches the JSON through the
backend's validated asset endpoint. `GuidedCreator/CircuitEditor.tsx` reuses `PLCircuit`'s
exported `CircuitSvg` so authoring and rendering share symbols.

Rules that hold across all three: coordinates are authored and absolute, there is no
auto-layout or wire routing, SVG text must use the `--color-text` token so it survives
theme switches, and parameter bindings resolve against `quiz_data.params` at render time
without re-fetching the definition.

## Guided creator

`features/GuidedCreator/` produces the four-file bundle in one multipart
`POST /developer/questions/with-files`. `formula.ts` is a **deliberately restricted**
tokenizer/parser/emitter: numeric literals, parameter identifiers, parentheses,
`+ - * / ^`, `pi`, `e`, and an approved list of single-argument functions — it emits both
Python and JavaScript. Do not replace it with `eval`, `Function`, `mathjs.evaluate`, or
any general evaluator. `generate.ts` handles validation, safe Markdown→HTML, and artifact
assembly.

## API layer and auth

`services/client.ts` is a bare axios instance with **no auth interceptor**. Tokens are
attached per call — `features/Auth/api.ts` and `features/QuestionBuilder/hooks.tsx`
each do `await user.getIdToken()` and set the header explicitly (~15 call sites in
`hooks.tsx`). Public endpoints (`/questions`, `runtimes/run`, `runtimes/assets`) are
called without a token.

In bypass mode (`VITE_AUTH_BYPASS_ENABLED=true`), `AuthContext.tsx` short-circuits
Firebase entirely: it synthesizes a fake `User` whose `getIdToken()` returns
`VITE_AUTH_BYPASS_TOKEN`, plus a fixed `developer`-role `UserRead`. The token must match
the backend's `AUTH_BYPASS_TOKEN`. Vite inlines `VITE_*` at dev-server start — restart
or recreate the container after changing them.

## Conventions

- Path style is relative imports (`../../../services`); there are no TS path aliases.
- Feature folders export through an `index.ts` barrel.
- Styling uses Tailwind utilities plus `var(--color-*)` / `var(--radius-*)` tokens
  defined in `src/index.css`; prefer tokens over hardcoded colors so dark mode works.
- Tests live beside the code (`Foo.tsx` + `Foo.test.tsx`) and use
  `@testing-library/react`. The highest-value covered areas are guided-creator
  generation, visual-definition validation, the instance store, and runtime API error
  mapping — keep those green.
