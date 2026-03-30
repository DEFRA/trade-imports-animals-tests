# trade-imports-animals-tests

This test suite provides a robust foundation for writing, executing, and maintaining automated tests that validate trade-imports-animals application functionality from a user perspective, ensuring quality and reliability across the application lifecycle.

## Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Local Testing](#local-testing)
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

## Running Tests

This project uses **Playwright Test** as the test runner, with TypeScript for type-safe test development.

| Command               | Action                             | Generates Report |
| --------------------- | ---------------------------------- | ---------------- |
| `npm test`            | Run frontend suite [CDP]           | ✓                |
| `npm run test:local`  | Run local suite                    | ✓                |
| `npm run test:github` | Run compose suite [GitHub Actions] | ✓                |

Optional: append these Playwright parameters to the command you're running (e.g. `npm test`) when needed.

| Playwright Parameters            | Action                                     |
| -------------------------------- | ------------------------------------------ |
| `-- --headed`                    | Run tests in headed mode (see the browser) |
| `-- tests/example.spec.ts`       | Run a specific test file                   |
| `-- --grep "@smoke"`             | Run tests with a specific tag              |
| `-- --debug`                     | Run tests in debug mode                    |
| `-- --ui`                        | Run tests with UI mode                     |
| `-- --project=frontend-chromium` | Run tests in a specific project            |

### Test Reports

| Command                      | Report                 | Generates Report |
| ---------------------------- | ---------------------- | ---------------- |
| `npx playwright show-report` | Open HTML report       | n/a              |
| `npm run report`             | Generate Allure report | ✓                |

After tests run, Playwright results and report are generated automatically, and Allure results are also generated automatically. Run `npm run report` to generate the Allure report.

### Test Configuration

The Playwright configuration is split across three files:

| File                          | Purpose                                | URL target                          |
| ----------------------------- | -------------------------------------- | ----------------------------------- |
| `playwright.config.ts`        | Base config for CDP environment runs   | CDP services (CDP URLs)             |
| `playwright.local.config.ts`  | Local development (headed, no retries) | Localhost (localhost URLs)          |
| `playwright.github.config.ts` | GitHub Actions runs                    | Docker Compose (container DNS URLs) |

Note:

- Intended for local development: `playwright.local.config.ts` targets the apps via localhost (e.g. `http://localhost:3000` / `http://localhost:3001`), so ensure the local Docker stack is running before starting the tests.
- Intended for GitHub Actions: `playwright.github.config.ts` targets the apps via Docker service DNS names (e.g. `trade-imports-animals-frontend:3000` / `trade-imports-animals-admin:3001`).

### Test Projects

Tests are split across two Playwright projects targeting different services:

| Project             | Test scope                      |
| ------------------- | ------------------------------- |
| `frontend-chromium` | All tests excluding admin pages |
| `admin-chromium`    | Admin pages only                |

`npm test` runs `frontend-chromium` by default.

## Local Testing

### Local Docker stack

1. Start the local stack with `docker compose` (from this repo’s root).
2. Run tests with `npm run test:local`.

The local config (`playwright.local.config.ts`) runs with 1 worker in headed mode with full tracing enabled.

Note:

Add the following entries to `/etc/hosts` as required by the local stack:

```text
127.0.0.1       trade-imports-defra-id-stub
```

#### Docker Compose example commands (local)

| Command                                                                  | Purpose                                               | Blocks shell |
| ------------------------------------------------------------------------ | ----------------------------------------------------- | ------------ |
| `docker compose up`                                                      | Start services in foreground                          | ✓            |
| `docker compose up -d`                                                   | Start services in background                          | ✗            |
| `docker compose up --wait`                                               | Start services and wait for health (detached)         | ✗            |
| `docker compose up --pull=always --wait`                                 | Always pull images, then start and wait               | ✗            |
| `docker compose up --force-recreate --wait`                              | Recreate containers from scratch, then start and wait | ✗            |
| `docker compose up --force-recreate --renew-anon-volumes --wait mongodb` | Recreate MongoDB and rerun init seed scripts          | ✗            |
| `docker compose pull`                                                    | Pull latest images for the stack                      | ✗            |
| `docker compose down`                                                    | Stop and remove containers                            | ✗            |
| `docker compose down -v`                                                 | Stop and remove containers and volumes                | ✗            |
| `docker compose logs -f`                                                 | Follow all service logs (tail -f style)               | ✓            |
| `docker compose logs -f trade-imports-animals-backend`                   | Follow backend logs (tail -f style)                   | ✓            |
| `docker compose logs --tail=200 trade-imports-animals-backend`           | Show last 200 backend log lines                       | ✗            |
| `docker compose ps`                                                      | Show running services and health status               | ✗            |
| `docker compose ps -a`                                                   | Show all services, including stopped                  | ✗            |
| `docker compose config`                                                  | Validate the rendered compose config                  | ✗            |

### Target CDP environments (from local machine)

To run tests against a CDP environment from your local machine:

1. Set `PLAYWRIGHT_ENVIRONMENT` to one of `dev`, `test`, or `perf-test` in your `.env`.
2. Run tests with `npm run test`.

Use `.env.example` as a template.
When running via the CDP Portal, `ENVIRONMENT` is provided by the portal; use `PLAYWRIGHT_ENVIRONMENT` and avoid setting `ENVIRONMENT` locally.

## Running Tests on GitHub

Tests can be run as a GitHub Actions workflow against services spun up in Docker Compose. When running in GitHub Actions, CDP access is via BrowserStack only.

### GitHub Actions workflow

The `/.github/workflows/e2e-tests.yml` workflow uses the composite action in `/run-e2e-tests/` to start the Docker Compose stack (`compose.yml`) and run the `playwright-tests` container, then publish reports.

## Running Tests via CDP Portal

Test Suite URL: https://portal.cdp-int.defra.cloud/test-suites/trade-imports-animals-tests (requires CCoE AWS OpenVPN).

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
