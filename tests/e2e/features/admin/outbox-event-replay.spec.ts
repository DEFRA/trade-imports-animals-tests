import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { timeouts } from '@config/timeouts';

/**
 * A seeded amendment leaves four events behind: created, edited, submitted,
 * amendment-requested. The edit is the save that puts the answers on the
 * notification — the frontend writes one per page, the seed writes one for the
 * lot, but neither reaches submitted without saving something first.
 */
const SEEDED_AMENDMENT_EVENT_COUNT = 4;

test.describe('Outbox event replay', { tag: ['@compose', '@integration'] }, () => {
  test.beforeEach(async ({ apiJourney }) => {
    await apiJourney.createAmendNotification();
  });

  test('replays outbox events and shows success banner', async ({ adminNavigation, pages, journeyContext }) => {
    await adminNavigation.toOutboxEvents(journeyContext.referenceNumber);

    await test.step('shows every outbox event before replay', async () => {
      await expect.poll(() => pages.adminOutboxEvents.tableRows.count(), { timeout: timeouts.short }).toBe(SEEDED_AMENDMENT_EVENT_COUNT);
    });

    await test.step('replays all events and shows success banner', async () => {
      await pages.adminOutboxEvents.btnReplay.click();
      await expect(pages.adminOutboxEvents.bannerSuccess).toBeVisible();
      await expect(pages.adminOutboxEvents.bannerSuccess).toContainText('All outbox events have been re-published to the SNS topic.');
    });

    await test.step('still shows every outbox event after replay', async () => {
      await expect(pages.adminOutboxEvents.tableRows).toHaveCount(SEEDED_AMENDMENT_EVENT_COUNT);
    });
  });

  test(
    'writes a REPLAY_EVENTS audit record covering every outbox event',
    { tag: '@mongodb' },
    async ({ adminNavigation, pages, journeyContext }) => {
      const referenceNumber = journeyContext.referenceNumber;

      await adminNavigation.toOutboxEvents(referenceNumber);
      await expect.poll(() => pages.adminOutboxEvents.tableRows.count(), { timeout: timeouts.short }).toBe(SEEDED_AMENDMENT_EVENT_COUNT);
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
        expect(doc?.numberOfEvents).toBe(SEEDED_AMENDMENT_EVENT_COUNT);
        expect(doc?.userId).toBeDefined();
        expect(doc?.timestamp).toBeDefined();
      } finally {
        await client.close();
      }
    },
  );
});
