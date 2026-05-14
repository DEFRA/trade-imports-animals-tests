#!/bin/sh
# Wipe mongo's volume and recreate the container so init scripts re-run on
# a fresh DB. Detects which compose stack is currently running — this works
# both standalone (CI / tests-repo-only dev) and inside the workspace layout
# (https://github.com/DEFRA/trade-imports-animals-workspace), where the
# workspace stack owns port 27017 and the tests-repo compose would clash.
#
# Errors out if no compose stack with a mongodb service is up — this script
# is a reseed, not a stand-up.
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TESTS_REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE_BOUNCE_MONGO="$TESTS_REPO_ROOT/../../scripts/stack/bounce-mongo.sh"
WORKSPACE_PROJECT="trade-imports-animals"
TESTS_PROJECT="trade-imports-animals-tests"

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
  "$TESTS_PROJECT")
    echo "Tests-repo stack detected — reseeding tests-repo mongo"
    cd "$TESTS_REPO_ROOT"
    exec docker compose up --force-recreate --renew-anon-volumes --wait mongodb
    ;;
  "")
    echo "error: no running compose stack with a mongodb service" >&2
    echo "  workspace:  ./scripts/stack/run-stack.sh (from workspace root)" >&2
    echo "  tests-repo: docker compose up -d (from $TESTS_REPO_ROOT)" >&2
    exit 1
    ;;
  *)
    echo "error: unknown compose project '$project' owns the running mongodb" >&2
    echo "  expected: $WORKSPACE_PROJECT or $TESTS_PROJECT" >&2
    exit 1
    ;;
esac
