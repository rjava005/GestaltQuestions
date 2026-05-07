#!/usr/bin/env bash
set -euo pipefail
trap 'echo "❌ Script failed at line $LINENO"; read -p "Press enter to exit..."' ERR
cleanup_ports() {
  echo "Cleaning up old Firebase processes..."

  # Kill ALL firebase processes
  pkill -f "firebase" 2>/dev/null || true

  # Kill anything using emulator ports
  for port in 9099 9199 4000 4400 4500; do
    fuser -k ${port}/tcp 2>/dev/null || true
  done

  # Give OS time to release ports
  sleep 5
}

cleanup() {
  echo "Stopping development services..."

  echo "Exporting Firebase emulator data..."
  firebase emulators:export ./emulator-data --force || true

  if [[ -n "${FIREBASE_PID:-}" ]]; then
    kill -INT -"${FIREBASE_PID}" 2>/dev/null || true
    wait "$FIREBASE_PID" 2>/dev/null || true
  fi

  docker compose -f compose.dev.yaml down || true
}

trap cleanup EXIT INT TERM

# 🔥 IMPORTANT: CLEAN FIRST
cleanup_ports

echo "Starting Firebase emulators..."

# Start in new process group
setsid firebase emulators:start --import=./emulator-data --export-on-exit &
FIREBASE_PID=$!

# Wait a bit for Firebase to bind ports
sleep 10

echo "Starting backend container..."
docker compose -f compose.dev.yaml up --build