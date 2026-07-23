import { test, expect } from '@fixtures';
import { CPH_NUMBER } from '@domain/constants/journey-options';
import { timeouts } from '@config/timeouts';

const EDITED_CPH_NUMBER = '987654321';

test.describe('Notification cancel amend', () => {
  test.describe('cancel amend button and confirmation page', () => {
    test.beforeEach(async ({ apiJourney, notificationActions }) => {
      const created = await apiJourney.createAmendNotification();
      await notificationActions.toNotificationView(created.referenceNumber);
    });

    test('shows the Cancel amendment option when notification is in Amend status', async ({ pages }) => {
      await expect(pages.notificationView.amendStatusTag).toBeVisible();
      await expect(pages.notificationView.btnCancelAmend).toBeVisible();
    });

    test('shows the confirmation page when Cancel amendment is selected', async ({ pages, journeyContext }) => {
      await pages.notificationView.btnCancelAmend.click();

      await expect(pages.page).toHaveURL(new RegExp(pages.notificationCancelAmend.expectedUrl(journeyContext.referenceNumber)));
      await expect(pages.notificationCancelAmend.heading).toBeVisible();
      await expect(pages.notificationCancelAmend.confirmationQuestion).toBeVisible();
      await expect(pages.notificationCancelAmend.btnYesCancelAmendment).toBeVisible();
      await expect(pages.notificationCancelAmend.btnNoReturnToNotification).toBeVisible();
    });

    test('returns to the notification view without cancelling when No is selected', async ({ pages, journeyContext }) => {
      const referenceNumber = journeyContext.referenceNumber;
      await pages.notificationCancelAmend.open(referenceNumber);
      await pages.notificationCancelAmend.btnNoReturnToNotification.click();

      await expect(pages.page).toHaveURL(new RegExp(pages.notificationView.expectedUrl(referenceNumber)));
      await expect(pages.notificationView.amendStatusTag).toBeVisible();
      await expect(pages.notificationView.btnCancelAmend).toBeVisible();
      await expect(pages.notificationView.changeLink('County Parish Holding number (CPH)')).toBeVisible();
    });
  });

  test('does not show the Cancel amendment option when notification is Submitted', async ({
    pages,
    apiJourney,
    notificationActions,
    journeyContext,
  }) => {
    const created = await apiJourney.createSubmittedNotification();
    const submittedReference = created.referenceNumber ?? journeyContext.referenceNumber;
    await notificationActions.toNotificationView(submittedReference);

    await expect(pages.notificationView.btnCancelAmend).not.toBeVisible();
    await expect(pages.notificationView.btnAmend).toBeVisible();
  });

  test(
    'cancels the amendment and restores the submitted notification',
    { tag: '@smoke' },
    async ({ pages, apiJourney, notificationActions, journeyContext }) => {
      const created = await apiJourney.createSubmittedNotification();
      const referenceNumber = created.referenceNumber ?? journeyContext.referenceNumber;

      await notificationActions.amendNotification(referenceNumber);
      await expect(pages.notificationView.summaryValue('County Parish Holding number (CPH)')).toHaveText(CPH_NUMBER);

      await pages.notificationView.changeLink('County Parish Holding number (CPH)').click();
      await pages.cphNumber.inputCphNumber.fill(EDITED_CPH_NUMBER);
      await pages.cphNumber.btnSaveAndContinue.click();
      await expect(pages.addresses.heading).toBeVisible();
      await expect(pages.addresses.cphNumber).toContainText(EDITED_CPH_NUMBER);

      await notificationActions.toNotificationView(referenceNumber);
      await expect(pages.notificationView.summaryValue('County Parish Holding number (CPH)')).toHaveText(EDITED_CPH_NUMBER);

      await pages.notificationView.btnCancelAmend.click();
      await pages.notificationCancelAmend.btnYesCancelAmendment.click();

      await expect(pages.notificationView.amendCancelledBanner).toBeVisible();
      await expect(pages.notificationView.amendCancelledBanner).toContainText('The amendment has been cancelled');

      await expect(pages.page).toHaveURL(new RegExp(`${pages.notificationView.expectedUrl(referenceNumber)}$`), {
        timeout: timeouts.medium,
      });

      await expect(pages.notificationView.amendStatusTag).not.toBeVisible();
      await expect(pages.notificationView.btnCancelAmend).not.toBeVisible();
      await expect(pages.notificationView.btnAmend).toBeVisible();
      await expect(pages.notificationView.changeLink('Where is this consignment coming from?')).not.toBeVisible();
      await expect(pages.notificationView.summaryValue('County Parish Holding number (CPH)')).toHaveText(CPH_NUMBER);
    },
  );
});
