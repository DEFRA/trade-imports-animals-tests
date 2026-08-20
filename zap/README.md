# ZAP security profile — local setup (Phase 1)

Temporary local scaffolding — see `docker-compose.yml`'s header comment
for why, and the workspace's `workareas/analysis/zap-playwright-*.md`
docs for the full design.

## Running locally

1. Bring up the app stack from the workspace root: `./scripts/stack/run-stack.sh`
2. Start ZAP and wait for it to be ready: `docker compose -f zap/docker-compose.yml up -d --wait`
   (`--wait` blocks until the container's healthcheck reports healthy — same
   convention `run-stack.sh` uses for the app stack — so this doesn't return
   until ZAP is actually accepting requests, not just started.)
3. Run the security profile: `npm run test:docker-compose:security`
   (to watch ZAP's own logs live while this runs, in another terminal:
   `docker logs -f zap-zap-1`)
4. Stop ZAP when done: `docker compose -f zap/docker-compose.yml down`

Reports are written to `zap-report/` (gitignored). Docker Compose creates
this directory automatically on first `up` — nothing to set up by hand.
`_clean` only clears its _contents_ between runs, never the directory
itself: ZAP bind-mounts it once at container start, so deleting the
directory while ZAP is running would break that mount for the rest of the
container's life.

## Files

- `docker-compose.yml` — standalone ZAP daemon, proxy on `localhost:8090` by default (`ZAP_PORT` overrides).
- `zap-automation.yaml` — the Automation Framework plan: scopes each app as
  its own context, runs a scoped active scan per context once passive
  scanning (automatic, via the proxy) settles, generates a JSON + HTML
  report per app.
- `rules.tsv` — the gate: which alert rule IDs fail the build vs. warn vs.
  are ignored as known false positives. See its own header for the format.
