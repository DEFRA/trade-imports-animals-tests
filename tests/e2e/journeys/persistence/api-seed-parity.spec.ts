import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type NotificationDocument } from '@domain/models/db/notification-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

/**
 * The seed has to stay indistinguishable from the journey it stands in for.
 *
 * `ApiJourney` mints notifications for the specs where the notification is
 * scenery — the dashboard, the a11y scans, the ZAP runs, cancel-amend. Those
 * specs only assert what they came to assert, so a seed that drifts from what
 * the UI writes goes unnoticed: it once seeded the fulfilments payload alone,
 * leaving the document empty, and every one of them still passed while the
 * dashboard rendered blank cards and the outbox events carried an empty
 * consignment.
 *
 * So compare the two directly. Both sides answer the same journey, so the
 * stored notification and the stored fulfilments have to match field for field.
 */
test.describe('API-seeded notifications match the UI journey', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the comparison reads Mongo directly, which only the compose stack exposes');
  });

  test('seeds the same notification a completed journey leaves behind', async ({ journey, journeyContext, apiJourney }) => {
    test.slow();
    const client = new MongoDbClient();

    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');

      const readBack = async (referenceNumber: string | undefined): Promise<NotificationDocument> => {
        if (!referenceNumber) {
          throw new Error('The notification under comparison has no reference number');
        }
        await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);
        const [document] = await collection.find({ referenceNumber }).toArray();
        return document;
      };

      await journey.submitNotification();
      const built = await readBack(journeyContext.journeyId);

      const seeded = await readBack((await apiJourney.createSubmittedNotification()).referenceNumber);

      expect(seeded.notification).toEqual(built.notification);
      expect(seeded.fulfilments).toEqual(built.fulfilments);
    } finally {
      await client.close();
    }
  });
});
