#!/bin/sh
#
# PROFILE selects the test suite to run (case-sensitive, defaults to 'default').
# Allowed values:
#   default (or unset) — standard run via npm test
#   a11y               — accessibility suite via npm run test:a11y
#   browserstack       — not implemented (exits 1)
#   security           — not implemented (exits 1)

echo "run_id: $RUN_ID"

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
  security)
    echo "security profile runs are not implemented yet."
    exit 1
    ;;
  *)
    echo "unknown PROFILE: '${PROFILE}'. Allowed values: default, a11y, browserstack, security (unset defaults to default)."
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
