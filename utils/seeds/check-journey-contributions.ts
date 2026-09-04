import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import type { NotificationDocument } from '@domain/models/db/notification-document';
import { journeyContributions } from '@domain/seeds/journey-contributions';
import { captureContributions } from '@utils/seeds/journey-capture';

/**
 * Proves the committed contributions still match what the application writes, so
 * `ApiJourney` seeds notifications a user could really have built. Not an
 * application test — it uses the app as the oracle for a fixture, which is why it
 * sits here rather than in `tests/`.
 */
const STALE = [
  'Journey contributions no longer match what the UI journey writes — the frontend',
  'obligations or Mapper A have moved. Re-record them with: npm run contributions:update',
].join(' ');

const FOLD = [
  'A seeded notification no longer matches the one the UI journey builds, even though the',
  'recorded contributions are current — so the fold is losing something. A page that clears',
  'an answer is the likely cause: contributions record what each page adds or changes, not',
  'what it removes.',
].join(' ');

test.describe('Journey contributions', () => {
  test('match what the UI journey writes', async ({ journey, journeyContext, addressBookApi, apiJourney }) => {
    test.slow();
    const captured = await captureContributions({ journey, journeyContext, addressBookApi });
    const drivenReference = journeyContext.journeyId;

    expect(captured, STALE).toEqual(journeyContributions);

    // The diff above compares the fold's inputs; this compares its output, which
    // is what specs actually seed. Only the second catches a fold that drops
    // something both sides of the diff agree about.
    const seeded = await apiJourney.createFullNotification();
    const client = new MongoDbClient();
    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      const written = async (referenceNumber: string) => {
        const [doc] = await collection.find({ referenceNumber }).toArray();
        return {
          notification: doc.notification,
          fulfilments: [...(doc.fulfilments ?? [])].sort((left, right) => left.obligationId.localeCompare(right.obligationId)),
        };
      };

      expect(await written(seeded.referenceNumber), FOLD).toEqual(await written(drivenReference));
    } finally {
      await client.close();
    }
  });

  test('seed a notification the overview reads as answered through the given page', async ({ apiJourney, pages }) => {
    // Covers the seeding path the diff above cannot: folding the contributions
    // through a page, resolving their tokens, and posting the result.
    const seeded = await apiJourney.createUpToPage('arrivalDetails');
    await pages.overview.open(seeded.referenceNumber);
    await pages.overview.heading.waitFor();

    const row = (name: string) => pages.page.locator('.govuk-task-list__item', { hasText: name });
    // Answered through arrival details and no further: the next page in the
    // journey is in scope (a road vehicle keeps transit countries) but unanswered.
    await expect(row('Arrival details')).toContainText('Completed');
    await expect(row('Transit countries')).toBeVisible();
    await expect(row('Transit countries')).not.toContainText('Completed');
  });
});
