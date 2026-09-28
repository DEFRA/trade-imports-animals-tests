/**
 * Seed a notification via the frontend's own save-and-continue routes and print
 * its reference number. Companion to the staleness-tools CLI on
 * trade-imports-animals-frontend — one command to make a notification, one to
 * mutate it:
 *
 *     REF=$(npm run --silent seed:notification -- --state draft)
 *     MONGODB_URI=mongodb://localhost:27017 npm --prefix ../trade-imports-animals-frontend \
 *       run seed:stale -- --scenario country-stale --ref $REF
 *
 * Uses SeededJourney unchanged — same POSTs the E2E tests use, so anything the
 * tests keep in sync (page order, required fields) flows through.
 *
 * Only works in stub mode: `GET /auth/sign-in` mints the session cookie without
 * an OIDC round-trip (see the frontend's `src/server/auth/stub-sign-in.js`). The
 * compose stack runs in stub mode by default; if you're pointed at a real Defra
 * ID service, this script won't authenticate.
 */
import dotenv from 'dotenv';
import { request } from '@playwright/test';
import { SeededJourney } from '@flows/seeded-journey';
import { FrontendFormClient } from '@adapters/http/frontend-form-client';
import { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import type { JourneyContext } from '@flows/journey';

dotenv.config({ quiet: true });

// Compose-stack defaults, matching playwright.docker-compose.config.ts. Read
// only if the env has not already set them — so a CDP / non-local run still
// works if the caller sets its own values.
process.env.TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL ??= 'http://localhost:3000';
process.env.TRADE_IMPORTS_ADDRESS_BOOK_URL ??= 'http://localhost:8089';

type State = 'draft' | 'submitted' | 'amend';

const parseState = (argv: readonly string[]): State => {
  const index = argv.indexOf('--state');
  const value = index >= 0 ? argv[index + 1] : 'submitted';
  if (value !== 'draft' && value !== 'submitted' && value !== 'amend') {
    throw new Error(`--state must be one of draft|submitted|amend, got: ${value ?? '(missing)'}`);
  }
  return value;
};

const seed = async (state: State, journey: SeededJourney): Promise<string> => {
  if (state === 'draft') return journey.createDraftNotification();
  if (state === 'amend') return journey.createAmendNotification();
  return journey.createSubmittedNotification();
};

const main = async (): Promise<void> => {
  const state = parseState(process.argv.slice(2));
  const baseURL = process.env.TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL;
  const context = await request.newContext({ baseURL });
  try {
    // Stub-mode sign-in: a plain GET mints the session cookie and stores it on
    // the request context's cookie jar. Every subsequent POST is authenticated.
    await context.get('/auth/sign-in');
    const forms = new FrontendFormClient(context);
    const addressBook = new AddressBookApiClient(context);
    const journeyContext: JourneyContext = {};
    const journey = new SeededJourney(forms, addressBook, journeyContext);
    const ref = await seed(state, journey);
    console.log(ref);
  } finally {
    await context.dispose();
  }
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
