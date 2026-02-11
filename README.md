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



