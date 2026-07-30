#!/bin/sh
# Preflight for the parity lane (npm test): fail fast with a pointer at the
# stack recipe instead of a wall of connection-refused Playwright errors.
set -eu

fail() {
  echo "error: $1 is not responding at $2" >&2
  echo "  npm test needs the workspace stack with BOTH frontends (test-target profile):" >&2
  echo "    ./scripts/stack/run-stack.sh -d                        # base stack, from the workspace root" >&2
  echo "    ./scripts/stack/run-stack.sh -d --profile test-target  # adds :3100 (reworked) + :3200 (main)" >&2
  exit 1
}

check() {
  curl -sf -o /dev/null --max-time 5 "$2/health" || fail "$1" "$2"
}

check "reworked frontend" "${REWORKED_FRONTEND_URL:-http://localhost:3100}"
check "main frontend" "${MAIN_FRONTEND_URL:-http://localhost:3200}"
check "admin" "${ADMIN_FRONTEND_URL:-http://localhost:3001}"
