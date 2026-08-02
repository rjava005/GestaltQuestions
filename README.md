---

# Gestalt Question Review — Local Development Setup

This guide explains how to run the **full Gestalt Question Review system locally**, including the backend API, AI Workspace, and frontend interface.
You may start each service manually or use Docker Compose to run everything together.

---

## Prerequisites

Before starting, ensure the following tools are installed:

* **Git**
* **Node.js (npm)**
* **Python 3.10 or higher**
* **Poetry** (optional but recommended)
  Installation Guide: [https://python-poetry.org/docs/#installation](https://python-poetry.org/docs/#installation)

---

## 1. Clone the Repository

If you have not already cloned the repository, do so with:

```bash
git clone https://github.com/lucib3196/Gestalt_Question_Review.git``
cd Gestalt_Question_Review
```

---

## 2. Overview of Required Services

The application consists of three main components that must be running:

1. **Backend API** (FastAPI): Main api for questions
2. **Code_Sandbox** (Fastapi): A sandbox env for code execution
3. **Frontend** (Vite + React): Ui for viewing the questions

Each service can be started individually in separate terminals, or all three can be started automatically using **Docker Compose**.

Installation and setup instructions for each component can be found at the following links:

* [Backend Setup Guide](https://github.com/lucib3196/GestaltQuestions/tree/feature/docker_install/backend)

* [Frontend Setup Guide](https://github.com/lucib3196/GestaltQuestions/tree/feature/docker_install/frontend)

---

## 3. Running All Services Manually

Below are the commands for running each service using Poetry and npm.
Alternative installation methods (pip, virtualenv, etc.) are detailed in the linked setup guides.

### Backend API

```bash
cd backend
poetry run python -m src.main
```

### Frontend

```bash
cd frontend
npm run dev
```

Each command should be run in its own terminal window.

---

## 4. Running All Services with Docker Compose

To start all components together using Docker:

```bash
docker compose up --build
```

Docker Compose will:

* Build the correct Dockerfiles for each service
* Start Backend, Code Sandbox, and Frontend
* Automatically handle networking between services

This is the easiest method for running the entire stack.

---

## Need Help?

If you encounter issues or need assistance with the setup, feel free to reach out:

**[lberm007@ucr.edu](mailto:lberm007@ucr.edu)**

---

## Circuit question authoring
## Signal-processing and control authoring

Questions can render `<pl-signal-plot file-name="signal-plot.json">`,
`<pl-block-diagram file-name="block-diagram.json">`, and standalone
`<pl-math-input answer-name="transfer">` fields. Signal-plot version 1 supports
finite continuous/piecewise traces, stems, impulses, multiple traces, shaded
regions, parameter bindings, toggles, cursor inspection, zoom/pan, and authored
draggable markers or intervals. Block-diagram version 1 supports explicitly
positioned transfer/function blocks, gains, sums, mixers, pickoffs, sources,
sinks, integrators, delays, labels, directed wires/feedback paths, parameter
bindings, and overlaid numeric or structured-math slots. Neither schema performs
automatic layout or routing.

MathLive fields show a focus-only, slot-filtered palette (a bottom drawer on
small/touch screens), while retaining keyboard, LaTeX command, and plain-text
fallback entry. The browser transports both display LaTeX and MathJSON. Only
recursively validated MathJSON is converted directly to SymPy; raw LaTeX is
never evaluated.

Python runtimes may import `gestalt_signal_systems` for bounded signal sampling,
piecewise functions, impulses, convolution, transforms, sampling, transfer
functions, series/parallel/feedback systems, responses, and finite JSON output.
The sandbox pins SymPy 1.14 and python-control 0.10.x.

Secure grading is opt in with runtime output keys `secure_grading: true`,
`answer_specs`, and `correct_answers`. Runs return an opaque instance ID but
omit answers/solutions. Submit to
`POST /questions/{qid}/runtimes/instances/{instance}/grade`; instances expire
after 24 hours and return 410 after expiry. Numeric, symbolic/algebraic,
transfer-function, definite/improper integral, derivative/partial derivative,
finite-sum, and authored one/two-sided limit slots are supported. Legacy
`correct_answers` behavior is unchanged. Framework-only examples are in
`backend/questions/framework_signal_demo` and `framework_feedback_demo`.

## Circuit question authoring

Circuit questions should keep an authored, versioned `circuit.json` beside
`question.html` and render it with:

```html
<pl-circuit file-name="circuit.json"></pl-circuit>
```

The JSON defines an SVG `viewBox`, accessible label, wire polylines, circuit
elements, annotations, and optional parameter bindings. Coordinates are authored
explicitly; the renderer does not perform automatic layout. A direct value
binding names a `quiz_data.params` path and its `sourceUnit`. A templated value
can combine several named bindings. Values are refreshed from the current
adaptive instance without reloading the definition. Version 2 definitions add
a parameter selector and independently authored variant scenes, allowing an
adaptive instance to redraw its topology without another asset request.

---
