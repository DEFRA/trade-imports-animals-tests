import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { timeouts } from '@config/timeouts';
import { type NotificationDocument } from '@domain/models/db/notification-document';
import { isComposeEnvironment } from '@utils/playwright/environment';

test.describe('Notification draft', () => {
  test('saves notification as a draft and lands on the declaration page', async ({ journey, journeyContext, pages }) => {
    await test.step('fill in the wizard up to declaration', async () => {
      await journey.toDeclaration();
    });

    await test.step('assert the UI reflects a successful draft save', async () => {
      await expect(pages.declaration.heading).toBeVisible();
      await expect(pages.declaration.referenceNumber).toBeVisible();
    });

    await test.step('check persistence', async (step) => {
      step.skip(!isComposeEnvironment(), 'persistence checked only in the docker compose stack');

      const referenceNumber = journeyContext.referenceNumber;
      const client = new MongoDbClient();

      try {
        await client.connect();
        const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
        await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

        const docs = await collection.find({ referenceNumber }).toArray();
        const [doc] = docs;

        expect(docs).toHaveLength(1);
        expect(doc.referenceNumber).toBe(referenceNumber);
        expect(doc.status).toBe('DRAFT');
      } finally {
        await client.close();
      }
    });
  });
});
