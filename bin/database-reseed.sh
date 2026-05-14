#!/bin/sh
# Wipe mongo's volume and recreate the container so init scripts re-run on
# a fresh DB. Detects which stack is currently up so this works both
# standalone (CI / tests-repo-only dev) and inside the workspace layout
# (https://github.com/DEFRA/trade-imports-animals-workspace), where the
# workspace stack owns port 27017 and the tests-repo compose would clash.
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TESTS_REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE_COMPOSE="$TESTS_REPO_ROOT/../../docker/stack/compose.yml"
WORKSPACE_PROJECT="trade-imports-animals"

if [ -n "$(docker compose -p "$WORKSPACE_PROJECT" ps -q mongodb 2>/dev/null)" ] && [ -f "$WORKSPACE_COMPOSE" ]; then
  echo "Workspace stack detected — reseeding workspace mongo"
  exec docker compose -p "$WORKSPACE_PROJECT" -f "$WORKSPACE_COMPOSE" \
    up --force-recreate --renew-anon-volumes --wait mongodb
fi

echo "Reseeding tests-repo mongo"
cd "$TESTS_REPO_ROOT"
exec docker compose up --force-recreate --renew-anon-volumes --wait mongodb
