import { test, expect } from '@fixtures';
import { defaultJourneyOptions, CONSIGNOR_NAME } from '@flows/journey';
import { timeouts } from '@config/timeouts';

test.describe('Outbox events (admin)', () => {
  const defaults = defaultJourneyOptions;

  test('shows outbox event for a submitted notification', async ({ journey, adminNavigation, journeyContext, pages }) => {
    await journey.submitNotification();
    const referenceNumber = journeyContext.notificationId;

    await adminNavigation.toOutboxEvents(referenceNumber);

    await test.step('renders the outbox events table with one row', async () => {
      await expect(pages.adminOutboxEvents.heading).toBeVisible();
      await expect.poll(() => pages.adminOutboxEvents.tableRows.count(), { timeout: timeouts.short }).toBe(1);
    });

    await test.step('displays correct envelope fields', async () => {
      await expect(pages.adminOutboxEvents.cellVersion(0)).toHaveText('1');
      await expect(pages.adminOutboxEvents.cellEventType(0)).toContainText('NotificationSubmitted');
      await expect(pages.adminOutboxEvents.cellTimestamp(0)).not.toBeEmpty();
    });

    await test.step('displays event data as JSON containing key notification fields', async () => {
      await pages.adminOutboxEvents.linkViewJson(0).click();
      const json = await pages.adminOutboxEvents.cellDataPre(0).textContent();
      expect(json).toContain(referenceNumber);
      expect(json).toContain(defaults.countryCode);
      // The trade-line commodity name/description are not yet mapped into the GBN-AG payload
      // (EUDPA-274 trade-line data gap), so defaults.commodityCode is not asserted here — see
      // outbox-event-notification.spec.ts, which smoke-checks the commodity section structurally.
      expect(json).toContain(defaults.pointOfEntry.code);
      expect(json).toContain(CONSIGNOR_NAME);
    });
  });

  test('shows empty state for an unknown reference number', async ({ adminNavigation, pages }) => {
    const unknownRef = 'GBN-AG-00-000000';
    await adminNavigation.toOutboxEvents(unknownRef);
    await expect(pages.adminOutboxEvents.emptyStateMessage).toBeVisible();
    await expect(pages.adminOutboxEvents.emptyStateMessage).toContainText(unknownRef);
  });
});
