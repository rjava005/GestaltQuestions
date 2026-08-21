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
DEMO_BUNDLE  := backend/questions/framework_schemdraw_demo
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
	@echo "  make diagrams         Regenerate $(DEMO_BUNDLE)/block-diagram.json"
	@echo "  make diagrams-check   Verify the committed diagram still matches its source"
	@echo "  make diagrams-clean   Remove the SchemDraw venv"

run_dev:
	docker compose -f compose.dev.yaml up

run_emulators:
	firebase emulators:start

# --- SchemDraw diagram generation -------------------------------------------
# SchemDraw solves the layout offline; the committed JSON is the artifact. See
# tools/schemdraw_bridge/README.md for why it does not run at request time.

$(VENV_PY):
	$(BASE_PY) -m venv $(DIAGRAM_VENV)
	$(VENV_PY) -m pip install --quiet --upgrade pip
	$(VENV_PY) -m pip install --quiet schemdraw==$(SCHEMDRAW_VERSION)

diagrams-setup: $(VENV_PY)
	@$(VENV_PY) -c "import schemdraw; print('schemdraw', schemdraw.__version__, 'ready')"

diagrams: $(VENV_PY)
	$(VENV_PY) $(DIAGRAM_DIR)/generate_examples.py --out $(DEMO_BUNDLE)
	@rm -f $(DEMO_BUNDLE)/circuit.json

# Regenerates into a scratch directory and compares. Catches a committed diagram
# that no longer matches the connectivity it claims to come from -- which would
# otherwise only surface as a surprise the next time someone runs `make diagrams`.
diagrams-check: $(VENV_PY)
	@$(VENV_PY) $(DIAGRAM_DIR)/generate_examples.py --out $(DIAGRAM_DIR)/.check >/dev/null
	@$(VENV_PY) $(DIAGRAM_DIR)/check_drift.py $(DEMO_BUNDLE)/block-diagram.json $(DIAGRAM_DIR)/.check/block-diagram.json
	@rm -rf $(DIAGRAM_DIR)/.check

diagrams-clean:
	rm -rf $(DIAGRAM_VENV) $(DIAGRAM_DIR)/.check
