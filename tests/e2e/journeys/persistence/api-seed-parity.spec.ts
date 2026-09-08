import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type NotificationDocument } from '@domain/models/db/notification-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

/**
 * The guard on seeding: drive the journey through the browser, seed the same
 * journey through the frontend's own routes, and compare what each stored.
 *
 * Seeding used to post a payload of its own straight to the backend, and drifted
 * from what the frontend actually writes with nothing to notice — every seeded
 * notification carried an empty document. Under frontend-driven seeding the two
 * sides run the same code path, so this should pass close to by construction.
 * It is kept because the live failure mode is now a missed page, which it
 * catches and nothing else does.
 */
test.describe('Seeded and browser-driven notifications match', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the comparison reads both stored documents from Mongo, which only the compose stack exposes');
  });

  test('a seeded notification stores what the same journey stores through the browser', async ({
    journey,
    journeyContext,
    seededJourney,
  }) => {
    await journey.submitNotification();
    const browserReference = journeyContext.journeyId;
    const seededReference = await seededJourney.createSubmittedNotification();

    const client = new MongoDbClient();
    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      const read = async (referenceNumber: string | undefined): Promise<NotificationDocument> => {
        await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);
        const [doc] = await collection.find({ referenceNumber }).toArray();
        return doc;
      };

      const browserDoc = await read(browserReference);
      const seededDoc = await read(seededReference);

      expect(seededDoc.status).toBe(browserDoc.status);
      // The whole content document, field for field. The arrival date is the
      // one answer that moves with the wall clock, and both sides derive it
      // from the same helper, so it compares like any other.
      expect(seededDoc.notification).toEqual(browserDoc.notification);
      // The opaque evaluator blob the UI reads back. Compared whole, never
      // inspected — its shape is the frontend's own.
      expect(seededDoc.fulfilments).toEqual(browserDoc.fulfilments);
    } finally {
      await client.close();
    }
  });
});
