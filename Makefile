# Gestalt Questions -- developer tasks.
#
# `make` is not installed with Git for Windows. Install it with
# `scoop install make` (or `choco install make`), or just run the command under
# whichever target you want -- they are all plain one-liners. Recipes assume a
# POSIX shell, which Git Bash and CI both provide.

.DEFAULT_GOAL := help

# The SchemDraw bridge is an authoring aid, not a runtime dependency, so it gets
# its own venv instead of joining the backend or sandbox dependency sets.
# tools/schemdraw_bridge/.venv is already covered by the **/.venv ignore rule.
DIAGRAM_DIR  := tools/schemdraw_bridge
DIAGRAM_VENV := $(DIAGRAM_DIR)/.venv
# Pinned so a regenerated diagram is reproducible, matching how the sandbox
# pins sympy and control.
SCHEMDRAW_VERSION := 0.23

ifeq ($(OS),Windows_NT)
VENV_PY := $(DIAGRAM_VENV)/Scripts/python.exe
BASE_PY := python
else
VENV_PY := $(DIAGRAM_VENV)/bin/python
BASE_PY := python3
endif

.PHONY: help run_dev run_emulators diagrams diagrams-setup diagrams-check diagrams-clean

help:
	@echo "Gestalt Questions"
	@echo ""
	@echo "  make run_dev          Start the development stack"
	@echo "  make run_emulators    Start the Firebase emulators"
	@echo ""
	@echo "  make diagrams-setup   Create the SchemDraw venv (schemdraw $(SCHEMDRAW_VERSION))"
	@echo "  make diagrams         Generate any missing question diagram from its own connectivity script"
	@echo "  make diagrams-check   Verify every committed diagram still matches its source"
	@echo "  make diagrams-clean   Remove the SchemDraw venv"

run_dev:
	docker compose -f compose.dev.yaml up

run_emulators:
	firebase emulators:start

# --- SchemDraw diagram generation -------------------------------------------
# SchemDraw solves the layout offline; the committed JSON is the artifact. See
# tools/schemdraw_bridge/README.md for why it does not run at request time.
#
# There is no per-bundle target here on purpose: regenerate.py discovers every
# backend/questions/*/generate_diagram.py itself, so adding a new question's
# diagram never means editing this file.

$(VENV_PY):
	$(BASE_PY) -m venv $(DIAGRAM_VENV)
	$(VENV_PY) -m pip install --quiet --upgrade pip
	$(VENV_PY) -m pip install --quiet schemdraw==$(SCHEMDRAW_VERSION)

diagrams-setup: $(VENV_PY)
	@$(VENV_PY) -c "import schemdraw; print('schemdraw', schemdraw.__version__, 'ready')"

diagrams: $(VENV_PY)
	PYTHONPATH=$(DIAGRAM_DIR) $(VENV_PY) $(DIAGRAM_DIR)/regenerate.py

diagrams-check: $(VENV_PY)
	PYTHONPATH=$(DIAGRAM_DIR) $(VENV_PY) $(DIAGRAM_DIR)/regenerate.py --check

diagrams-clean:
	rm -rf $(DIAGRAM_VENV)
