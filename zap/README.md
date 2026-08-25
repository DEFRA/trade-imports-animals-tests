# ZAP security profile — local setup

Temporary local scaffolding — see `docker-compose.yml`'s header comment
for why, and the workspace's `workareas/analysis/zap-playwright-*.md`
docs for the full design. The same plan files and gate are reused by
CDP's `entrypoint.sh` (`security`/`security:active` profiles) —
this doc only covers running locally.

## Running locally

1. Bring up the app stack from the workspace root: `./scripts/stack/run-stack.sh`
2. Back in this repo's root (`trade-imports-animals-tests/`), start ZAP and wait for it to be ready: `docker compose -f zap/docker-compose.yml up -d --wait`
   (`--wait` blocks until the container's healthcheck reports healthy — same
   convention `run-stack.sh` uses for the app stack — so this doesn't return
   until ZAP is actually accepting requests, not just started.)
3. Run the security profile: `npm run test:docker-compose:security` (passive
   only, matching CDP's default) or `npm run test:docker-compose:security:active`
   (passive + active — the thorough option, safe to run routinely here since
   local is disposable, unlike CDP)
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

- `docker-compose.yml` — standalone ZAP daemon, proxy on `localhost:9095` by default (`ZAP_PORT` overrides).
- `zap-automation-context.yaml` — context registration only (dataDrivenNodes,
  excludePaths), no scanning. Run via `_zap_prime_context` _before_ the
  Playwright run, because Structural Modifiers only apply to site-tree nodes
  as they're added — registering the context after traffic already exists
  (which is when the two plans below would otherwise first create it) is too
  late. Keep its `env.contexts` block in sync with the two plans below.
- `zap-automation-passive.yaml` — the Automation Framework plan: scopes each
  app as its own context, generates one combined JSON + HTML report covering
  every site ZAP touched from passive scanning alone (automatic, via the
  proxy). The default here and on CDP — safe to run on demand with no
  destructive risk.
- `zap-automation-active.yaml` — the same, plus a scoped active scan per
  context once passive scanning settles. Safe to run routinely locally
  (disposable), invoked deliberately elsewhere.
- `rules.tsv` — the gate: which alert rule IDs fail the build vs. warn vs.
  are ignored as known false positives. See its own header for the format.
