#!/bin/sh
# Wipe mongo's volume and recreate the container so init scripts re-run on
# a fresh DB. Delegates to the workspace stack's bounce-mongo.sh
# (https://github.com/DEFRA/trade-imports-animals-workspace) — the workspace
# stack is the only compose stack.
#
# Errors out if the stack isn't up — this script is a reseed, not a stand-up.
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TESTS_REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE_BOUNCE_MONGO="$TESTS_REPO_ROOT/../../scripts/stack/bounce-mongo.sh"
WORKSPACE_PROJECT="trade-imports"

project="$(docker ps --filter 'label=com.docker.compose.service=mongodb' --format '{{.Label "com.docker.compose.project"}}' | head -1)"

case "$project" in
  "$WORKSPACE_PROJECT")
    if [ ! -x "$WORKSPACE_BOUNCE_MONGO" ]; then
      echo "error: workspace mongo is up but $WORKSPACE_BOUNCE_MONGO is missing / not executable" >&2
      exit 1
    fi
    echo "Workspace stack detected — delegating to scripts/stack/bounce-mongo.sh"
    exec "$WORKSPACE_BOUNCE_MONGO"
    ;;
  "")
    echo "error: no running stack with a mongodb service" >&2
    echo "  start it: ./scripts/stack/run-stack.sh (from the workspace root)" >&2
    exit 1
    ;;
  *)
    echo "error: unknown compose project '$project' owns the running mongodb" >&2
    echo "  expected: $WORKSPACE_PROJECT" >&2
    exit 1
    ;;
esac
