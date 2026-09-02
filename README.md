# trade-imports-animals-tests

This test suite provides a robust foundation for writing, executing, and maintaining automated tests that validate trade-imports-animals application functionality from a user perspective, ensuring quality and reliability across the application lifecycle.

## Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Editor Setup](#editor-setup)
- [Running Tests](#running-tests)
- [Local Testing](#local-testing)
- [Visual Regression Tests](#visual-regression-tests)
- [Security Testing](#security-testing)
- [Running Tests on GitHub](#running-tests-on-github)
- [Running Tests via CDP Portal](#running-tests-via-cdp-portal)
- [Developer Workflow](#developer-workflow)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)
- [Licence](#licence)

## Prerequisites

- Node.js v24
- npm package manager

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd trade-imports-animals-tests
   ```

2. Use the correct version of Node.js:

   ```bash
   nvm use
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Install Playwright browsers:

   ```bash
   npx playwright install
   ```

   Or install only Chromium (for faster setup):

   ```bash
   npx playwright install chromium
   ```

## Editor Setup

### TypeScript version (VS Code and Cursor)

To keep TypeScript checks and editor behaviour consistent with this repository and CI, use the workspace TypeScript version in your editor:

1. Open any `.ts` or `.tsx` file.
2. Open Command Palette (`Cmd+Shift+P` on macOS).
3. Run `TypeScript: Select TypeScript Version`.
4. Select `Use Workspace Version`.

## Running Tests

This project uses **Playwright Test** as the test runner, with TypeScript for type-safe test development.

| Command                                       | Test scope                                            | Target               | Config                                | Generates Report |
| --------------------------------------------- | ----------------------------------------------------- | -------------------- | ------------------------------------- | ---------------- |
| `npm test`                                    | E2E suite, excluding `@compose` and `@a11y`           | CDP                  | `playwright.config.ts`                | ✓                |
| `npm run test:a11y`                           | Accessibility (`@a11y`) test suite                    | CDP                  | `playwright.config.ts`                | ✓                |
| `npm run test:docker-compose`                 | E2E + E2E integration (`@compose`) test suites        | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |
| `npm run test:docker-compose:a11y`            | Accessibility (`@a11y`) test suite                    | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |
| `npm run test:docker-compose:security`        | ZAP passive scan against the whole e2e suite          | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |
| `npm run test:docker-compose:security:active` | Security (`@active`, ZAP passive + active scan) suite | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |
| `npm run test:docker-compose:ci`              | E2E, for the workspace CI stack job                   | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |

Optional: append these Playwright parameters to the command you're running (e.g. `npm test`) when needed.

| Playwright Parameters      | Action                                     |
| -------------------------- | ------------------------------------------ |
| `-- --headed`              | Run tests in headed mode (see the browser) |
| `-- tests/example.spec.ts` | Run a specific test file                   |
| `-- --grep "@smoke"`       | Run tests with a specific tag              |
| `-- --debug`               | Run tests in debug mode                    |
| `-- --ui`                  | Run tests with UI mode                     |
| `-- --project=e2e`         | Run tests in a specific project            |

### Test Reports

| Command                      | Report                 | Generates Report |
| ---------------------------- | ---------------------- | ---------------- |
| `npx playwright show-report` | Open HTML report       | n/a              |
| `npm run report`             | Generate Allure report | ✓                |

After tests run, Playwright results and report are generated automatically, and Allure results are also generated automatically. Run `npm run report` to generate the Allure report.

### Test Configuration

Shared settings (projects, reporters, `retries: 1`, `trace: on-first-retry`)
live in `utils/playwright/shared-config.ts`. The target-specific configs extend
those settings:

| File                                  | Target               |
| ------------------------------------- | -------------------- |
| `playwright.config.ts`                | CDP services         |
| `playwright.docker-compose.config.ts` | docker-compose stack |

`@a11y` tests use the same configs; per-test timeout is longer in
`fixtures/a11y.ts`.

### Authenticated session reuse

Each worker signs in once per project and its tests restore that session
instead of driving the identity provider every time (`fixtures/auth-state.ts`).
Saved state lives under `playwright/.auth/` (gitignored, removed by `_clean`),
holds only the `sid` auth cookie, and is never written unless a fresh context
has proved it restores to a signed-in landing page. A spec that must start
unauthenticated opts out with `test.use({ storageState: COLD_START })`.

`E2E_SESSION_REUSE=off` is the kill switch: every test signs in for itself
again, so re-cap workers (e.g. `-- --workers=4`) to protect the auth stub.
Reuse is on by default against the docker-compose stack. On CDP it stays off
until `ENVIRONMENT=<env> npm run probe:cdp-session-reuse` has passed against
the target environment — the probe signs in once per service and proves
load-balanced replicas honour a session minted against another — after which a
lane opts in with `E2E_SESSION_REUSE=on`.

The `docker-compose` config targets `localhost:3000` / `localhost:3001`, so
start the workspace stack first. CI runs `npm run test:docker-compose:ci`
against that stack via the workspace reusable workflow.

### Test Projects

Both configs split tests across the same two Playwright projects:

| Project | Test scope                      |
| ------- | ------------------------------- |
| `e2e`   | All tests excluding admin pages |
| `admin` | Admin pages only                |

## Local Testing

### Local workspace stack

1. From the [workspace root](https://github.com/DEFRA/trade-imports-workspace),
   start the locally built stack:

   ```bash
   ./scripts/stack/run-stack.sh -d
   ```

2. Run the E2E and admin projects with `npm run test:docker-compose`.

`npm run test:docker-compose` targets the stack frontend on :3000 and the
admin service on :3001.

To debug, append Playwright flags, e.g.
`npm run test:docker-compose -- --headed --workers=1`.

The suite does not wipe the database before it runs, and does not need to.
Every spec creates the state it asserts on through the front door (the
backend API), scoped to that run, so the specs pass against a database that
already holds the records of earlier runs.

For the security (OWASP ZAP) profiles against this stack, see
[Security Testing](#security-testing) below.

#### Workspace stack commands (run from the workspace root)

| Command                             | Purpose                                                |
| ----------------------------------- | ------------------------------------------------------ |
| `./scripts/stack/run-stack.sh`      | Start the full stack from published images             |
| `./scripts/stack/run-stack.sh -d`   | Start the stack built from local source under `repos/` |
| `./scripts/stack/stop-stack.sh`     | Stop the stack and wipe volumes                        |
| `./scripts/stack/bounce-backend.sh` | Recreate the backend container (picks up Java changes) |

See `docker/stack/AGENTS.md` in the workspace for the full flag reference.

### Target CDP environments (from local machine)

To run tests against a CDP environment from your local machine:

1. Set `PLAYWRIGHT_ENVIRONMENT` to one of `dev`, `test`, or `perf-test` in your `.env`.
2. Run tests with `npm test`.

Use `.env.example` as a template.
When running via the CDP Portal, `ENVIRONMENT` is provided by the portal; use `PLAYWRIGHT_ENVIRONMENT` and avoid setting `ENVIRONMENT` locally.

## Visual Regression Tests

Visual regression tests (tagged `@visual`) guard rendered composition — layout, spacing, colour, and typography as the user sees the page. They compare screenshots against committed baseline images and fail if any pixels differ outside the masked regions.

Baselines are stored alongside their spec files in `*-snapshots/` directories and must be committed. Each platform requires its own baseline — update both when visual changes are intentional.

Regenerate the E2E baseline against the stack frontend with
`npm run test:visual:update:macos` for the host-rendered `*-darwin.png` image and
`npm run test:visual:update:linux` for the container-rendered `*-linux.png` image
used by CI. Both commands run the `e2e` project's `@visual` spec and write the
updated snapshot into the working tree for commit.

## Security Testing

Security profiles run a DAST (Dynamic Application Security Testing) scan against real, authenticated user journeys, using [OWASP ZAP](https://www.zaproxy.org/) as a proxy — Playwright drives real journeys through it rather than ZAP crawling independently, so it observes exactly what a real user session touches, then attacks what it finds.

Two profiles:

- `security` — passive scan against the whole e2e suite (cheap — no attack traffic — so run broadly), safe to run routinely
- `security:active` — passive + a scoped active scan against the deliberately curated `@active`-tagged suite only (attacks are slow and expensive per URL), safe to run routinely here since local is disposable (invoked deliberately elsewhere)

### Running locally

1. From the [workspace root](https://github.com/DEFRA/trade-imports-workspace), start the app stack: `tim docker up`
2. Bring up ZAP too (additive — doesn't disturb what's already running): `tim docker up --profile security`
   (this always waits for its containers' healthchecks, so it doesn't return until ZAP is actually accepting requests, not just started.)
3. Run the profile: `npm run test:docker-compose:security` or `npm run test:docker-compose:security:active`
   (to watch ZAP's own logs live while this runs, in another terminal: `docker logs -f trade-imports-zap-1`)
4. Stop ZAP when done (or just leave it running — cheap to leave up between runs, same as the rest of the stack): `docker stop trade-imports-zap-1`

Reports are written to `zap-report/` (gitignored). ZAP creates this directory automatically on first `up` — nothing to set up by hand. `_clean` only clears its _contents_ between runs, never the directory itself: ZAP bind-mounts it once at container start, so deleting the directory while ZAP is running would break that mount for the rest of the container's life.

ZAP itself runs as part of the shared workspace stack (`docker/stack/security.compose.yml`), opt-in via `--profile security`. The same plan files and gate are reused by CDP's `entrypoint.sh` (`security`/`security:active` profiles), which runs ZAP as an in-process daemon there rather than a separate container.

> **Docker Desktop for Mac:** ZAP relies on `network_mode: host` to resolve the app stack's `localhost` OIDC redirects. OrbStack supports this out of the box; Docker Desktop only matches it on version 4.34+ with host networking explicitly enabled in Settings (off by default) — otherwise ZAP can't reach the stack.

## Running Tests on GitHub

E2E tests run in GitHub Actions via the workspace's reusable workflow, which starts the workspace stack with `run-stack.sh --branch <branch>` and runs this repo's published test image against it, with reports published to GitHub Pages.

### GitHub Actions workflow

The `/.github/workflows/workspace-e2e-tests.yml` workflow triggers after `Publish Branch Image` completes and calls `DEFRA/trade-imports-workspace/.github/workflows/e2e-tests.yml@main` with the branch name, then reports the result back to the PR.

### Scheduled security scan

The `/.github/workflows/scheduled-security-scan.yml` workflow calls `DEFRA/trade-imports-workspace/.github/workflows/security-active-scan.yml@main`, which starts the workspace stack plus the `security` profile and runs a `security:active` scan against `main`/`:latest`, gating the run on FAIL-rated alerts the same way a failing test does. Currently manual dispatch only — the nightly schedule is disabled pending a verified end-to-end run (see the workflow file).

The report publishes to GitHub Pages under `security-active/<date>/`, password-protected (`ZAP_REPORT_PASSWORD` secret) since the tests repo's Pages site is otherwise public and unauthenticated. Reports older than 7 days are pruned automatically.

## Running Tests via CDP Portal

Test Suite URL: https://portal.cdp-int.defra.cloud/test-suites/trade-imports-animals-tests (requires CCoE AWS OpenVPN).

In the CDP Portal, provide a `PROFILE` value to choose which test suite the container runs via `entrypoint.sh`.
If `PROFILE` is not set, the `default` profile is used.

| PROFILE           | Test suite                                      | NPM script                                                                     |
| ----------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| `default`         | e2e test suite                                  | `npm test`                                                                     |
| `a11y`            | accessibility test suite                        | `npm run test:a11y`                                                            |
| `security`        | security test suite (ZAP passive scan)          | `npm run test:security`                                                        |
| `security:active` | security test suite (ZAP passive + active scan) | `npm run test:security` (active plan selected via `PROFILE` in the ZAP config) |

Tests are run from the CDP Portal under the Test Suites section. See the requirements below for how the portal run executes and publishes results.

### CDP Portal requirements

- The CDP Portal run depends on the image being built/published by `/.github/workflows/publish.yml` (from this repo's `Dockerfile`).
- The container entrypoint (`entrypoint.sh`) must exit `0` on success and a non-zero code on failure.
- Reports are published to S3 by `npm run report:publish` (which runs `./bin/publish-tests.sh` and uses `RESULTS_OUTPUT_S3_PATH`).

## Developer Workflow

### Linting

This project uses **ESLint** and **Prettier** for code quality and formatting.

| Action                   | Command                | Tool       |
| ------------------------ | ---------------------- | ---------- |
| Check for linting issues | `npm run lint`         | ESLint     |
| Auto-fix linting         | `npm run lint:fix`     | ESLint     |
| Format code              | `npm run format`       | Prettier   |
| Check code formatting    | `npm run format:check` | Prettier   |
| Type check TypeScript    | `npm run typecheck`    | TypeScript |

### Commit Checklist

Before committing changes:

- Run `npm run lint:fix` to auto-fix linting issues
- Run `npm run format` to format code
- Run `npm run typecheck` to check types (recommended)

### Pre-commit Hooks

This project uses **Husky** and **lint-staged** to automatically validate code quality before commits. The pre-commit hook checks linting (ESLint) and formatting (Prettier) on staged files only. If checks fail, the commit is blocked.

## Troubleshooting

### Tests fail with browser not found

Run `npx playwright install` to install required browsers.

### TypeScript errors

Ensure TypeScript is properly installed and `tsconfig.json` is configured correctly.

### Tests timeout

Increase timeout in `playwright.config.ts` or in individual tests using `test.setTimeout()`.

### Apple Silicon Docker build fails

Build with `--platform=linux/amd64` due to the AWS CLI v2 dependency:

```bash
docker build --platform=linux/amd64 .
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright TypeScript Guide](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

## Licence

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

<http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3>

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government licence v3

### About the licence

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable
information providers in the public sector to license the use and re-use of their information under a common open
licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
