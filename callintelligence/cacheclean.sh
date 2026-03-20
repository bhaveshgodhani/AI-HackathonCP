#!/usr/bin/env bash
# Clear frontend build caches and rebuild the Docker "web" image so nginx serves fresh assets.
# Run this from the host in the call-intelligence directory (not inside the nginx container—
# that image has no Node/npm; the frontend is baked in at image build time).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "==> Cleaning local frontend caches under $ROOT/frontend"
rm -rf frontend/node_modules/.cache \
       frontend/node_modules/.vite \
       frontend/.vite \
       frontend/dist

LOCAL_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --local-only) LOCAL_ONLY=1 ;;
    -h|--help)
      echo "Usage: $0 [--local-only]"
      echo "  (default)  Remove Vite/npm caches + frontend/dist, then rebuild web image via Docker Compose."
      echo "  --local-only  Only delete caches and dist; skip Docker (use for local npm run dev/build)."
      exit 0
      ;;
  esac
done

if [[ "$LOCAL_ONLY" -eq 1 ]]; then
  echo "==> Done (--local-only; no Docker rebuild)."
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found; install Docker or use: $0 --local-only" >&2
  exit 1
fi

echo "==> Rebuilding web service (no cache) so containerized frontend matches your source"
docker compose build --no-cache web
docker compose up -d web

echo "==> Finished. Open the app URL (default http://localhost:8080). Hard-refresh the browser if needed."
