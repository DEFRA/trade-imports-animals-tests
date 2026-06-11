# Seed fixtures

Canonical mongo seed data for the trade-imports-animals stack. This repo
owns the notification seed fixtures (test data); the workspace stack
(DEFRA/trade-imports-animals-workspace) stages `seeds/mongodb/` into the
mongo container's `/docker-entrypoint-initdb.d` via
`scripts/stack/run-stack.sh`, alongside the workspace-owned replica-set
init script.

Files must stay flat in `seeds/mongodb/` — the mongo image only executes
top-level files in its init directory — and keep their numeric prefixes,
which set execution order after the workspace's `10-database-setup.js`.
