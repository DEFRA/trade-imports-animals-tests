#!/bin/sh
#
# PROFILE selects the test suite to run (case-sensitive, defaults to 'default').
# Allowed values:
#   default (or unset)  — standard run via npm test
#   a11y                — accessibility suite via npm run test:a11y
#   browserstack        — not implemented (exits 1)
#   security            — ZAP passive scan only, safe to run routinely
#   security:active     — ZAP passive + active scan, invoked deliberately only

echo "run_id: $RUN_ID"

# Starts ZAP as a background process (CDP has no separate container to run
# it in, unlike local's docker-compose setup), points the security specs and
# the gate at it, then shuts it down. Shared by both security profiles below
# — which plan file gets used is picked up from PROFILE itself (see
# config/zap.ts), not passed in here.
run_security_profile() {
  export ZAP_API_KEY="$(node -e 'console.log(require("crypto").randomBytes(16).toString("hex"))')"
  # Absolute, not relative: zap.sh cd's to its own install directory (/zap)
  # before running, regardless of where it was launched from, so a relative
  # path here would resolve against the wrong base entirely.
  export ZAP_PLAN_DIR="/app/zap"

  # zap-automation-*.yaml hardcode reportDir: /zap/wrk/zap-report — locally
  # that's a bind mount onto ../zap-report; here there's no separate
  # container to mount across, so symlink it to where zap-run-and-gate.ts
  # actually reads reports from instead of changing either side.
  mkdir -p /app/zap-report /zap/wrk
  ln -sfn /app/zap-report /zap/wrk/zap-report

  zap.sh -daemon -host 127.0.0.1 -port "${ZAP_PORT:-8090}" \
    -config api.key="$ZAP_API_KEY" \
    -config api.addrs.addr.name=.* \
    -config api.addrs.addr.regex=true \
    -config anticsrf.tokens.token.name=crumb &
  zap_pid=$!

  # Mirrors zap/docker-compose.yml's healthcheck timing (5s interval, 10 retries).
  zap_ready=false
  i=0
  while [ $i -lt 10 ]; do
    if curl --silent --output /dev/null --fail "http://127.0.0.1:${ZAP_PORT:-8090}/"; then
      zap_ready=true
      break
    fi
    i=$((i + 1))
    sleep 5
  done

  if [ "$zap_ready" != "true" ]; then
    echo "ZAP did not become ready before timing out" >> FAILED
    return 1
  fi

  # Chained, not two independent statements: the gate (and any active scan
  # it triggers) must never run against a spec run that failed or refused
  # to start — e.g. the prod guard in shared-config.ts, which only test:security
  # goes through, not this gate step on its own.
  npm run test:security && npm run _zap_run_and_gate
  security_exit_code=$?
  if [ $security_exit_code -ne 0 ]; then
    echo "security profile exited $security_exit_code before completing" >> FAILED
  fi

  kill "$zap_pid" 2>/dev/null
}

case "${PROFILE:-default}" in
  default)
    # Record a non-zero npm test exit in the FAILED marker: a run that dies
    # before Playwright starts (e.g. the workspace run's reseed needs the
    # workspace checkout this image does not have) must not report a pass.
    npm test || echo "npm test exited $? before completing" >> FAILED
    ;;
  a11y)
    npm run test:a11y || echo "npm run test:a11y exited $? before completing" >> FAILED
    ;;
  browserstack)
    echo "browserstack profile runs are not implemented yet."
    exit 1
    ;;
  security | security:active)
    run_security_profile
    ;;
  *)
    echo "unknown PROFILE: '${PROFILE}'. Allowed values: default, a11y, browserstack, security, security:active (unset defaults to default)."
    exit 1
    ;;
esac

npm run report:publish
publish_exit_code=$?

if [ $publish_exit_code -ne 0 ]; then
  echo "failed to publish test results"
  exit $publish_exit_code
fi

# At the end of the test run, if the suite has failed we write a file called 'FAILED'
if [ -f FAILED ]; then
  echo "test suite failed"
  cat ./FAILED
  exit 1
fi

echo "test suite passed"
exit 0
