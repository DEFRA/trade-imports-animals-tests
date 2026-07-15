import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { timeouts } from '@config/timeouts';

test.describe('Outbox event replay', { tag: ['@compose', '@integration'] }, () => {
  test.afterEach(async ({ journeyContext, notificationActions }) => {
    if (journeyContext.notificationId) {
      await notificationActions.deleteNotification(journeyContext.notificationId);
    }
  });

  test('replays outbox events and shows success banner', async ({ apiJourney, adminNavigation, pages }) => {
    const notification = await apiJourney.createAmendNotification();
    const referenceNumber = notification.referenceNumber;

    await adminNavigation.toOutboxEvents(referenceNumber);

    await test.step('shows two outbox events before replay', async () => {
      await expect.poll(() => pages.adminOutboxEvents.tableRows.count(), { timeout: timeouts.short }).toBe(2);
    });

    await test.step('replays all events and shows success banner', async () => {
      await pages.adminOutboxEvents.btnReplay.click();
      await expect(pages.adminOutboxEvents.bannerSuccess).toBeVisible();
    });

    await test.step('still shows the two outbox events after replay', async () => {
      await expect(pages.adminOutboxEvents.tableRows).toHaveCount(2);
    });
  });

  test(
    'writes a REPLAY_EVENTS audit record covering both outbox events',
    { tag: '@mongodb' },
    async ({ apiJourney, adminNavigation, pages }) => {
      const notification = await apiJourney.createAmendNotification();
      const referenceNumber = notification.referenceNumber;

      await adminNavigation.toOutboxEvents(referenceNumber);
      await expect.poll(() => pages.adminOutboxEvents.tableRows.count(), { timeout: timeouts.short }).toBe(2);
      await pages.adminOutboxEvents.btnReplay.click();
      await expect(pages.adminOutboxEvents.bannerSuccess).toBeVisible();

      const client = new MongoDbClient();

      try {
        await client.connect();
        const collection = client.collection('trade-imports-animals-backend', 'audit');

        await expect
          .poll(() => collection.countDocuments({ notificationReferenceNumbers: referenceNumber, action: 'REPLAY_EVENTS' }), {
            timeout: timeouts.short,
          })
          .toBe(1);

        const doc = await collection.findOne({ notificationReferenceNumbers: referenceNumber, action: 'REPLAY_EVENTS' });
        expect(doc?.action).toBe('REPLAY_EVENTS');
        expect(doc?.result).toBe('SUCCESS');
        expect(doc?.notificationReferenceNumbers).toEqual([referenceNumber]);
        expect(doc?.numberOfNotifications).toBe(2);
        expect(doc?.userId).toBeDefined();
        expect(doc?.timestamp).toBeDefined();
      } finally {
        await client.close();
      }
    },
  );
});
