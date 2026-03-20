#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required: https://docs.docker.com/get-docker/"
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "Docker Compose plugin or docker-compose binary is required."
  exit 1
fi

if [ ! -f backend/.env ]; then
  if [ -f backend/.env.example ]; then
    cp backend/.env.example backend/.env
    echo "Created backend/.env from backend/.env.example — set OPENAI_API_KEY before uploading calls."
  else
    echo "OPENAI_API_KEY=" > backend/.env
    echo "Created backend/.env — set OPENAI_API_KEY."
  fi
fi

echo "Building and starting containers..."
"${COMPOSE[@]}" up --build -d

PORT="${WEB_PORT:-8080}"
echo ""
echo "Call Intelligence is running."
echo "  UI:    http://localhost:${PORT}"
echo "  API:   http://localhost:${PORT}/api/..."
echo "  Docs:  http://localhost:${PORT}/docs"
echo ""
echo "Logs:    ${COMPOSE[*]} logs -f"
echo "Stop:    ${COMPOSE[*]} down"
