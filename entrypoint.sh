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

# zap-automation-*.yaml reference these via ${ENV_VAR} substitution (ZAP's
# own Automation Framework mechanism) instead of hardcoding localhost — ZAP
# resolves them from its own process environment, so they have to be
# exported before zap.sh starts, not computed by the Node/tsx side (that
# would only land in the Playwright child process's own env, never back up
# to this shell). Frontend/admin/ins are always reached directly, built
# straight from the same ENVIRONMENT CDP already sets.
configure_zap_urls() {
  export ZAP_TRADE_IMPORTS_ANIMALS_FRONTEND_URL="https://trade-imports-animals-frontend.${ENVIRONMENT}.cdp-int.defra.cloud"
  export ZAP_TRADE_IMPORTS_ANIMALS_ADMIN_URL="https://trade-imports-animals-admin.${ENVIRONMENT}.cdp-int.defra.cloud"
  export ZAP_TRADE_IMPORTS_INS_FRONTEND_URL="https://trade-imports-ins-frontend.${ENVIRONMENT}.cdp-int.defra.cloud"

  # Mirrors cdpServiceUrl() — Playwright itself routes backend calls through
  # the ephemeral gateway when CDP_LOCAL=true, so ZAP has to target the same
  # host or its sites: filter matches nothing.
  if [ "$CDP_LOCAL" = "true" ]; then
    export ZAP_TRADE_IMPORTS_ANIMALS_BACKEND_URL="https://ephemeral-protected.api.${ENVIRONMENT}.cdp-int.defra.cloud/trade-imports-animals-backend"
  else
    export ZAP_TRADE_IMPORTS_ANIMALS_BACKEND_URL="https://trade-imports-animals-backend.${ENVIRONMENT}.cdp-int.defra.cloud"
  fi
}

# Starts ZAP as a background process (CDP has no separate container to run
# it in, unlike local's docker-compose setup), points the security specs and
# the gate at it, then shuts it down. Shared by both security profiles below
# — which plan file gets used is picked up from PROFILE itself (see
# config/zap.ts), not passed in here.
run_security_profile() {
  configure_zap_urls

  export ZAP_API_KEY="$(node -e 'console.log(require("crypto").randomBytes(16).toString("hex"))')"
  # Absolute, not relative: zap.sh cd's to its own install directory (/zap)
  # before running, regardless of where it was launched from, so a relative
  # path here would resolve against the wrong base entirely.
  export ZAP_PLAN_DIR="/app/zap"

  # CDP's own "Report" link is driven by whichever directory gets published
  # (it looks for index.html inside it) — see the final publish step below.
  export REPORT_DIR="zap-report"

  # zap-automation-*.yaml hardcode reportDir: /zap/wrk/zap-report — locally
  # that's a bind mount onto ../zap-report; here there's no separate
  # container to mount across, so symlink it to where zap-run-and-gate.ts
  # actually reads reports from instead of changing either side.
  mkdir -p /app/zap-report /zap/wrk
  ln -sfn /app/zap-report /zap/wrk/zap-report

  # CDP has no internet route, so ZAP's check-for-updates/news/telemetry
  # calls would otherwise stall instead of failing fast. -silent is ZAP's
  # own documented flag for all three (zaproxy.org/faq/what-calls-home-
  # does-zap-make).
  zap.sh -daemon -silent -host 127.0.0.1 -port "${ZAP_PORT:-9095}" \
    -config api.key="$ZAP_API_KEY" \
    -config api.addrs.addr.name=.* \
    -config api.addrs.addr.regex=true \
    -config anticsrf.tokens.token.name=crumb &
  zap_pid=$!

  # Mirrors zap/docker-compose.yml's healthcheck timing (5s interval, 10 retries).
  zap_ready=false
  i=0
  while [ $i -lt 10 ]; do
    if curl --silent --output /dev/null --fail "http://127.0.0.1:${ZAP_PORT:-9095}/"; then
      zap_ready=true
      break
    fi
    i=$((i + 1))
    sleep 5
  done

  if [ "$zap_ready" = "true" ]; then
    # Chained, not two independent statements: the gate (and any active scan
    # it triggers) must never run against a spec run that failed or refused
    # to start — e.g. the prod guard in shared-config.ts, which only test:security
    # goes through, not this gate step on its own.
    npm run test:security && npm run _zap_run_and_gate
    security_exit_code=$?
    if [ $security_exit_code -ne 0 ]; then
      echo "security profile exited $security_exit_code before completing" >> FAILED
    fi
  else
    # Still fall through to kill/cp below — ZAP did start (just never became
    # ready), and the readiness failure itself is exactly the kind of thing
    # zap.log explains. Returning early here used to skip both.
    echo "ZAP did not become ready before timing out" >> FAILED

    # No scan ran, so zap-run-and-gate.ts's index.html (which needs a
    # completed scan's alert data) never gets written either — publish a
    # minimal one of our own so the published report explains the failure
    # instead of shipping a bare zap.log with no landing page.
    cat > "$REPORT_DIR/index.html" <<EOF
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>ZAP security scan — FAILED</title></head>
<body>
<h1>ZAP security scan — FAILED</h1>
<p>ZAP did not become ready before timing out — no scan ran.</p>
<p>See <a href="zap.log">zap.log</a> for diagnostics.</p>
</body>
</html>
EOF
  fi

  # wait, not just kill: zap.log is only complete once the process has
  # actually exited, so copying right after kill (no wait) could grab it
  # mid-flush.
  kill "$zap_pid" 2>/dev/null
  wait "$zap_pid" 2>/dev/null

  # ZAP's own internal log — separate from what it prints to stdout, and
  # the only place some of its own errors ever get written ("ZAP errors
  # logged - see the zap.log file for details"). Copied after kill so it's
  # complete, and into $REPORT_DIR so it survives the container being torn
  # down — linked from index.html (see zap-run-and-gate.ts).
  cp "$HOME/.ZAP/zap.log" "$REPORT_DIR/zap.log" || echo "could not copy ZAP's own log (zap.log) into $REPORT_DIR"
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

# security profiles publish zap-report/ (their index.html is the ZAP
# summary, not the Playwright report) and skip the allure-generate step,
# which has nothing to do with ZAP output. Every other profile keeps the
# existing report:publish sequence unchanged.
if [ "${REPORT_DIR:-playwright-report}" = "zap-report" ]; then
  ./bin/publish-tests.sh "$REPORT_DIR"
  publish_exit_code=$?
else
  npm run report:publish
  publish_exit_code=$?
fi

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
