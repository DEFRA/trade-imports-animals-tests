import { test, expect } from '@fixtures';
import { SqsClient } from '@adapters/queue/sqs-client';
import { seedDlqMessage } from '@domain/seeds/dlq-event';
import { timeouts } from '@config/timeouts';

test.describe('Security scan (admin, operator actions)', { tag: '@active' }, () => {
  // Serial: the DLQ delete-all acts on the whole queue. Every other destructive
  // call here is scoped to ids this spec created, so stays safely parallel.
  test.describe.configure({ mode: 'serial' });

  let sqs: SqsClient;

  test.beforeAll(() => {
    sqs = new SqsClient();
  });

  test.afterAll(() => {
    sqs.destroy();
  });

  test('routes the admin write actions through the ZAP proxy', async ({ apiJourney, adminNavigation, pages }) => {
    test.slow();
    const notification = await apiJourney.createAmendNotification();

    // The admin service's one POST that is not a delete, on its own route.
    await adminNavigation.toOutboxEvents(notification.referenceNumber);
    await expect.poll(() => pages.adminOutboxEvents.tableRows.count(), { timeout: timeouts.short }).toBeGreaterThan(0);
    await pages.adminOutboxEvents.btnReplay.click();
    await expect(pages.adminOutboxEvents.bannerSuccess).toBeVisible();

    // DELETE /notifications, scoped to this reference — never the whole table.
    await pages.adminNotifications.open();
    await pages.adminNotifications.inputReferenceNumber.fill(notification.referenceNumber);
    // deleteByReferenceNumber only opens the confirmation dialog; the DELETE
    // itself fires from the dialog's own confirm button.
    await pages.adminNotifications.deleteByReferenceNumber();
    await pages.adminNotifications.btnConfirm.click();
    await expect(pages.adminNotifications.alertSuccess).toBeVisible();

    // The DLQ buttons only render on a non-empty queue, so seed one first.
    const eventId = await seedDlqMessage(sqs);
    await adminNavigation.toDlqEvents();
    await expect(async () => {
      if (!(await pages.adminDlqEvents.rowById(eventId).isVisible())) {
        await pages.page.reload();
      }
      await expect(pages.adminDlqEvents.rowById(eventId)).toBeVisible({ timeout: timeouts.short });
    }).toPass({ timeout: timeouts.medium });

    await pages.adminDlqEvents.btnDeleteAll.click();
    await pages.adminDlqEvents.btnConfirmDeleteAll.click();
    await expect(pages.adminDlqEvents.bannerSuccess).toBeVisible();

    // The service's static page — nothing else in the suite reaches it.
    await pages.page.goto('/about');
  });
});
