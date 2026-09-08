import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type NotificationDocument } from '@domain/models/db/notification-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

/**
 * Increment 1's proof, deliberately sited under the admin project.
 *
 * The obstacle frontend-driven seeding has to clear is that auth state is
 * minted per project: this spec's own browser session is an admin session on
 * :3001, and several seeding specs run here. Proving it on the e2e project
 * would prove nothing, because there the project session already is a frontend
 * session.
 *
 * It asserts the stored document, not the response, because an empty
 * notification document is exactly the failure being designed out.
 */
test.describe('Frontend seed context', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the seed proof asserts on Mongo directly, which only the compose stack exposes');
  });

  test('seeds an origin answer into the notification document from an admin-project spec', async ({ frontendForms }) => {
    const created = await frontendForms.postForm('/notifications');
    expect(created).toMatch(/^\/notifications\/[^/]+\/origin$/);

    const referenceNumber = created.split('/')[2];
    await frontendForms.postForm(`/notifications/${referenceNumber}/origin`, {
      countryOfOrigin: 'FR',
      regionOfOriginCodeRequirement: 'no',
      regionOfOriginCodeSuffix: '',
      internalReferenceNumber: 'Imports456GB',
    });

    const client = new MongoDbClient();
    try {
      await client.connect();
      const collection = client.collection<NotificationDocument>('trade-imports-animals-backend', 'notification');
      await expect.poll(() => collection.countDocuments({ referenceNumber }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ referenceNumber }).toArray();
      // The document, not the fulfilments blob: seeding straight to the backend
      // wrote the blob and left this null.
      expect(doc.notification.origin).toEqual({
        countryCode: 'FR',
        requiresRegionCode: 'no',
        internalReference: 'Imports456GB',
      });
      expect(doc.fulfilments?.length).toBeGreaterThan(0);
    } finally {
      await client.close();
    }
  });

  test('refuses a page the frontend rejected, rather than seeding half a notification', async ({ frontendForms }) => {
    const created = await frontendForms.postForm('/notifications');
    const referenceNumber = created.split('/')[2];

    // Not a country on the list, so the page re-renders with an error summary
    // instead of saving. A seeder that read that as success would leave a
    // notification whose origin was never answered.
    await expect(frontendForms.postForm(`/notifications/${referenceNumber}/origin`, { countryOfOrigin: 'Narnia' })).rejects.toThrow(
      /responded 400/,
    );
  });
});
