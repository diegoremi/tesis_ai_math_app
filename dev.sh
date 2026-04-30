#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

function ensure_backend_env() {
  if [ ! -f "$ROOT_DIR/backend/.env" ]; then
    echo "[backend] .env not found. Copying from .env.example..."
    cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
    echo "  Update backend/.env before re-running if necessary."
  fi
}

function ensure_ai_env() {
  if [ ! -f "$ROOT_DIR/ai_module/.env" ] && [ -f "$ROOT_DIR/ai_module/.env.example" ]; then
    echo "[ai_module] .env not found. Copying from .env.example..."
    cp "$ROOT_DIR/ai_module/.env.example" "$ROOT_DIR/ai_module/.env"
    echo "  Update ai_module/.env with GEMINI_API_KEY if available."
  fi
}

function check_port() {
  local port=$1
  if lsof -Pi :"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "ERROR: Port $port is already in use."
    return 1
  fi
}

function start_ai_module() {
  echo "[ai_module] starting uvicorn..."
  local activate_script
  if [ -f "$ROOT_DIR/ai_module/.venv/bin/activate" ]; then
    activate_script="$ROOT_DIR/ai_module/.venv/bin/activate"
  elif [ -f "$ROOT_DIR/ai_module/venv/bin/activate" ]; then
    activate_script="$ROOT_DIR/ai_module/venv/bin/activate"
  else
    echo "Virtual environment not found in ai_module/.venv. Creating..."
    python3 -m venv "$ROOT_DIR/ai_module/.venv"
    activate_script="$ROOT_DIR/ai_module/.venv/bin/activate"
  fi

  # shellcheck source=/dev/null
  source "$activate_script"
  pip install -q -r "$ROOT_DIR/ai_module/requirements.txt"
  uvicorn main:app --reload --host 0.0.0.0 --port 8001
}

function start_backend() {
  echo "[backend] starting npm run dev..."
  cd "$ROOT_DIR/backend"
  npm install
  npm run dev
}

function start_frontend() {
  echo "[frontend] starting npm start..."
  cd "$ROOT_DIR/frontend"
  npm install
  npm start
}

ensure_backend_env
ensure_ai_env

check_port 8001
check_port 8080
check_port 3000

(
  cd "$ROOT_DIR/ai_module"
  start_ai_module
) &
AI_PID=$!

(
  cd "$ROOT_DIR/backend"
  start_backend
) &
BE_PID=$!

(
  cd "$ROOT_DIR/frontend"
  start_frontend
) &
FE_PID=$!

cleanup() {
  echo ""
  echo "Shutting down services..."
  kill "$AI_PID" "$BE_PID" "$FE_PID" 2>/dev/null || true
  wait
}
trap cleanup EXIT INT TERM

printf "\nServices launched:\n"
echo "  AI module PID:   $AI_PID (http://localhost:8001)"
echo "  Backend PID:     $BE_PID (http://localhost:8080)"
echo "  Frontend PID:    $FE_PID (http://localhost:3000)"

echo "Press Ctrl+C to stop all services."

wait
