#!/bin/sh
# Regenerate a visual baseline in a Linux container.
# Bind-mounts the repo so the updated snapshot is written to the host.
#
# Usage: ./bin/update-visual-baselines-linux.sh [Playwright arguments]
#
# Prerequisites: workspace stack running (./scripts/stack/run-stack.sh).
# Reseeds the database on the host before the container run.
#
# Override PLAYWRIGHT_IMAGE, NODE_MODULES_VOLUME, MONGODB_URI, TRADE_IMPORTS_ANIMALS_BACKEND_URL, REWORKED_FRONTEND_URL, or CONTAINER_USER to customise the container run.
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PLAYWRIGHT_IMAGE="${PLAYWRIGHT_IMAGE:-mcr.microsoft.com/playwright:v1.61.1-jammy}"
# Run as the invoking user's UID:GID so bind-mounted reports and snapshots are host-owned, not root.
CONTAINER_USER="${CONTAINER_USER:-$(id -u):$(id -g)}"
NODE_MODULES_VOLUME="${NODE_MODULES_VOLUME:-trade-imports-animals-tests-container-nm}"
MONGODB_URI="${MONGODB_URI:-mongodb://host.docker.internal:27017/?tls=false&directConnection=true}"
TRADE_IMPORTS_ANIMALS_BACKEND_URL="${TRADE_IMPORTS_ANIMALS_BACKEND_URL:-http://host.docker.internal:8085}"
REWORKED_FRONTEND_URL="${REWORKED_FRONTEND_URL:-http://localhost:3000}"

cd "$REPO_ROOT"
npm run database:reseed

# Named volumes mount root-owned; chown so CONTAINER_USER can npm ci (and own Linux node_modules).
docker run --rm \
  --platform linux/amd64 \
  --user root \
  -v "$NODE_MODULES_VOLUME:/app/node_modules" \
  "$PLAYWRIGHT_IMAGE" \
  sh -ec "mkdir -p /app/node_modules && chown -R '$CONTAINER_USER' /app/node_modules"

# Install Linux dependencies into the named volume before running the npm script.
docker run --rm \
  --platform linux/amd64 \
  --user "$CONTAINER_USER" \
  -v "$REPO_ROOT:/app" \
  -v "$NODE_MODULES_VOLUME:/app/node_modules" \
  -w /app \
  -e HOME=/tmp \
  "$PLAYWRIGHT_IMAGE" \
  npm ci --ignore-scripts

# The container's UID:GID has no passwd entry or home in the image; point tool caches at writable /tmp.
docker run --rm \
  --platform linux/amd64 \
  --user "$CONTAINER_USER" \
  --add-host=host.docker.internal:host-gateway \
  -v "$REPO_ROOT:/app" \
  -v "$NODE_MODULES_VOLUME:/app/node_modules" \
  -w /app \
  -e HOME=/tmp \
  -e TZ=Europe/London \
  -e PLAYWRIGHT_IN_CONTAINER=1 \
  -e MONGODB_URI="$MONGODB_URI" \
  -e TRADE_IMPORTS_ANIMALS_BACKEND_URL="$TRADE_IMPORTS_ANIMALS_BACKEND_URL" \
  -e REWORKED_FRONTEND_URL="$REWORKED_FRONTEND_URL" \
  --entrypoint npm \
  "$PLAYWRIGHT_IMAGE" \
  run _test_e2e -- --grep @visual --update-snapshots --workers=1 "$@"
