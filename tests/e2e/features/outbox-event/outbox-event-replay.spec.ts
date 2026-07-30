import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { timeouts } from '@config/timeouts';

/**
 * Integration seam: an operator re-publishes a notification's outbox events from the admin UI.
 *
 * The seed is a submitted-then-amended notification, so two outbox events exist (NotificationSubmitted +
 * the amend event — outbox-event-notification.spec.ts pins emission and envelope). Replay re-publishes
 * every event to the SNS topic without consuming them, and the backend writes one REPLAY_EVENTS audit
 * record covering the whole batch.
 */
test.describe('Outbox event replay', { tag: ['@compose', '@integration'] }, () => {
  test.beforeEach(async ({ apiJourney }) => {
    await apiJourney.createAmendNotification();
  });

  test.afterEach(async ({ pages, journeyContext }) => {
    if (journeyContext.referenceNumber) {
      await pages.page.goto(`/notifications/${journeyContext.referenceNumber}/delete`);
      await pages.page.getByRole('heading', { name: 'Delete this notification?' }).waitFor();
      await pages.page.getByRole('button', { name: 'Yes, delete notification' }).click();
      await pages.page.getByText('The notification has been deleted.').waitFor();
    }
  });

  test('replays outbox events and shows success banner', async ({ adminNavigation, pages, journeyContext }) => {
    await adminNavigation.toOutboxEvents(journeyContext.referenceNumber);

    await test.step('shows two outbox events before replay', async () => {
      await expect.poll(() => pages.adminOutboxEvents.tableRows.count(), { timeout: timeouts.short }).toBe(2);
    });

    await test.step('replays all events and shows success banner', async () => {
      await pages.adminOutboxEvents.btnReplay.click();
      await expect(pages.adminOutboxEvents.bannerSuccess).toBeVisible();
      await expect(pages.adminOutboxEvents.bannerSuccess).toContainText('All outbox events have been re-published to the SNS topic.');
    });

    await test.step('still shows the two outbox events after replay', async () => {
      await expect(pages.adminOutboxEvents.tableRows).toHaveCount(2);
    });
  });

  test(
    'writes a REPLAY_EVENTS audit record covering both outbox events',
    { tag: '@mongodb' },
    async ({ adminNavigation, pages, journeyContext }) => {
      const referenceNumber = journeyContext.referenceNumber;

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
        expect(doc?.numberOfNotifications).toBe(1);
        expect(doc?.numberOfEvents).toBe(2);
        expect(doc?.userId).toBeDefined();
        expect(doc?.timestamp).toBeDefined();
      } finally {
        await client.close();
      }
    },
  );
});
