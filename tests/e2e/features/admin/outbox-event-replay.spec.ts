import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { timeouts } from '@config/timeouts';
import { type AdminOutboxEventsPage } from '@page-objects/admin/admin-outbox-events-page';

/**
 * How many events a seeded notification produces is not this spec's business,
 * and pinning it to a number made it a hostage to the journey's length: seeding
 * through the frontend emits one edit per page answered, so a page added or
 * folded away moves the total. What replay promises is that the events survive
 * it — so the count is read before and compared after, and the milestones are
 * asserted by type.
 */
const EVENT_PREFIX = 'uk.gov.defra.imports.notification';
const LIFECYCLE_MILESTONES = [
  `${EVENT_PREFIX}.NotificationCreated`,
  `${EVENT_PREFIX}.NotificationSubmitted`,
  `${EVENT_PREFIX}.NotificationAmendmentRequested`,
];

const milestonesOf = (eventTypes: string[]): string[] => eventTypes.filter((eventType) => !eventType.includes('Edited'));

const eventTypesOn = async (outboxEvents: AdminOutboxEventsPage): Promise<string[]> =>
  (await outboxEvents.eventTypeCells.allTextContents()).map((eventType) => eventType.trim());

test.describe('Outbox event replay', { tag: ['@compose', '@integration'] }, () => {
  test.beforeEach(async ({ seededJourney }) => {
    await seededJourney.createAmendNotification();
  });

  test('replays outbox events and shows success banner', async ({ adminNavigation, pages, journeyContext }) => {
    await adminNavigation.toOutboxEvents(journeyContext.referenceNumber);

    await test.step('lists the notification lifecycle before replay', async () => {
      await expect
        .poll(async () => milestonesOf(await eventTypesOn(pages.adminOutboxEvents)), { timeout: timeouts.short })
        .toEqual(LIFECYCLE_MILESTONES);
    });

    const before = await pages.adminOutboxEvents.tableRows.count();

    await test.step('replays all events and shows success banner', async () => {
      await pages.adminOutboxEvents.btnReplay.click();
      await expect(pages.adminOutboxEvents.bannerSuccess).toBeVisible();
      await expect(pages.adminOutboxEvents.bannerSuccess).toContainText('All outbox events have been re-published to the SNS topic.');
    });

    await test.step('keeps every event it replayed', async () => {
      await expect(pages.adminOutboxEvents.tableRows).toHaveCount(before);
    });
  });

  test(
    'writes a REPLAY_EVENTS audit record covering every replayed event',
    { tag: '@mongodb' },
    async ({ adminNavigation, pages, journeyContext }) => {
      const referenceNumber = journeyContext.referenceNumber;

      await adminNavigation.toOutboxEvents(referenceNumber);
      await expect.poll(() => pages.adminOutboxEvents.tableRows.count(), { timeout: timeouts.short }).toBeGreaterThan(0);
      const replayed = await pages.adminOutboxEvents.tableRows.count();

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
        expect(doc?.numberOfEvents).toBe(replayed);
        expect(doc?.userId).toBeDefined();
        expect(doc?.timestamp).toBeDefined();
      } finally {
        await client.close();
      }
    },
  );
});
