import { test, expect } from '@fixtures';
import { timeouts } from '@config/timeouts';

/**
 * Integration seam: the admin operator UI over real data — the outbox events an operator inspects.
 *
 * A real UI submission emits the NotificationSubmitted outbox event (see outbox-event-notification.spec.ts);
 * this asserts the operator can find and inspect it on the admin Outbox events page. The write lags the
 * submit, so the search is re-issued until the row appears.
 */
test.describe('Outbox events (admin)', { tag: ['@integration', '@mongodb'] }, () => {
  test('shows the outbox event for a submitted notification', async ({ journey, journeyContext, adminNavigation, pages }) => {
    test.slow();
    await journey.submitNotification();
    const referenceNumber = journeyContext.journeyId;

    await adminNavigation.toOutboxEvents(referenceNumber);
    await expect
      .poll(
        async () => {
          await pages.adminOutboxEvents.inputReferenceNumber.fill(referenceNumber);
          await pages.adminOutboxEvents.btnSearch.click();
          return pages.adminOutboxEvents.tableRows.count();
        },
        { timeout: timeouts.long },
      )
      .toBe(1);

    await expect(pages.adminOutboxEvents.cellVersion(0)).toHaveText('1');
    await expect(pages.adminOutboxEvents.cellEventType(0)).toContainText('NotificationSubmitted');
    await expect(pages.adminOutboxEvents.cellTimestamp(0)).not.toBeEmpty();

    await pages.adminOutboxEvents.linkViewJson(0).click();
    const json = await pages.adminOutboxEvents.cellDataPre(0).textContent();
    expect(json).toContain(referenceNumber);
    expect(json).toContain('SUBMITTED');
  });

  test('shows the empty state for an unknown reference number', async ({ adminNavigation, pages }) => {
    const unknownRef = 'GBN-AG-00-000000';
    await adminNavigation.toOutboxEvents(unknownRef);
    await expect(pages.adminOutboxEvents.emptyStateMessage).toBeVisible();
    await expect(pages.adminOutboxEvents.emptyStateMessage).toContainText(unknownRef);
  });
});
