import { test, expect } from '@fixtures';
import { timeouts } from '@config/timeouts';

/**
 * Integration seam: the admin operator UI over real data — operating on a real submitted notification.
 *
 * A real UI submission writes the notification the admin lists; this proves the operator can find it and
 * delete it by reference number.
 */
test.describe('Notifications (admin)', { tag: ['@integration', '@mongodb'] }, () => {
  test('finds and deletes a submitted notification by reference number', async ({ journey, journeyContext, adminNavigation, pages }) => {
    test.slow();
    await journey.submitNotification();
    const referenceNumber = journeyContext.journeyId;

    await adminNavigation.toNotifications();
    await pages.adminNotifications.findRowByReference(referenceNumber);
    await expect(pages.adminNotifications.tableRowByReference(referenceNumber)).toBeVisible();

    await pages.adminNotifications.inputReferenceNumber.fill(referenceNumber);
    await pages.adminNotifications.deleteByReferenceNumber();
    await pages.adminNotifications.btnConfirm.click();
    await expect(pages.adminNotifications.alertSuccess).toBeVisible();

    await expect
      .poll(async () => pages.adminNotifications.tableRowByReference(referenceNumber).isVisible(), {
        timeout: timeouts.medium,
      })
      .toBe(false);
  });
});
