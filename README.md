# trade-imports-animals-tests

This test suite provides a robust foundation for writing, executing, and maintaining automated tests that validate trade-imports-animals application functionality from a user perspective, ensuring quality and reliability across the application lifecycle.

## Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Editor Setup](#editor-setup)
- [Running Tests](#running-tests)
- [Local Testing](#local-testing)
- [Visual Regression Tests](#visual-regression-tests)
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

| Command                            | Test scope                                     | Target               | Config                                | Generates Report |
| ---------------------------------- | ---------------------------------------------- | -------------------- | ------------------------------------- | ---------------- |
| `npm test`                         | E2E suite, excluding `@compose` and `@a11y`    | CDP                  | `playwright.config.ts`                | ✓                |
| `npm run test:a11y`                | Accessibility (`@a11y`) test suite             | CDP                  | `playwright.config.ts`                | ✓                |
| `npm run test:docker-compose`      | E2E + E2E integration (`@compose`) test suites | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |
| `npm run test:docker-compose:a11y` | Accessibility (`@a11y`) test suite             | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |
| `npm run test:docker-compose:ci`   | E2E, for the workspace CI stack job            | docker-compose stack | `playwright.docker-compose.config.ts` | ✓                |

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

1. From the [workspace root](https://github.com/DEFRA/trade-imports-animals-workspace),
   start the locally built stack:

   ```bash
   ./scripts/stack/run-stack.sh -d
   ```

2. Run the E2E and admin projects with `npm run test:docker-compose`.

`npm run test:docker-compose` targets the stack frontend on :3000 and the
admin service on :3001.

To debug, append Playwright flags, e.g.
`npm run test:docker-compose -- --headed --workers=1`.

`npm run test:docker-compose` reseeds the database first via `npm run database:reseed`,
which delegates to the workspace stack's `bounce-mongo.sh`. Seed fixtures for
this repo are staged from [`seeds/mongodb/`](seeds/mongodb/) into the stack's
mongo init by `run-stack.sh` — the directory may hold no active fixtures,
since the preference is to seed notification state at test level through the
front door (the backend API) rather than the back door (writing directly
into Mongo).

#### Workspace stack commands (run from the workspace root)

| Command                             | Purpose                                                |
| ----------------------------------- | ------------------------------------------------------ |
| `./scripts/stack/run-stack.sh`      | Start the full stack from published images             |
| `./scripts/stack/run-stack.sh -d`   | Start the stack built from local source under `repos/` |
| `./scripts/stack/stop-stack.sh`     | Stop the stack and wipe volumes                        |
| `./scripts/stack/bounce-mongo.sh`   | Recreate MongoDB and rerun the init + seed scripts     |
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
used by CI. Both commands reseed the workspace database, run the `e2e` project's
`@visual` spec, and write the updated snapshot into the working tree for commit.

## Running Tests on GitHub

E2E tests run in GitHub Actions via the workspace's reusable workflow, which starts the workspace stack with `run-stack.sh --branch <branch>` and runs this repo's published test image against it, with reports published to GitHub Pages.

### GitHub Actions workflow

The `/.github/workflows/workspace-e2e-tests.yml` workflow triggers after `Publish Branch Image` completes and calls `DEFRA/trade-imports-animals-workspace/.github/workflows/e2e-tests.yml@main` with the branch name, then reports the result back to the PR.

## Running Tests via CDP Portal

Test Suite URL: https://portal.cdp-int.defra.cloud/test-suites/trade-imports-animals-tests (requires CCoE AWS OpenVPN).

In the CDP Portal, provide a `PROFILE` value to choose which test suite the container runs via `entrypoint.sh`.
If `PROFILE` is not set, the `default` profile is used.

| PROFILE   | Test suite               | NPM script          |
| --------- | ------------------------ | ------------------- |
| `default` | e2e test suite           | `npm test`          |
| `a11y`    | accessibility test suite | `npm run test:a11y` |

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
