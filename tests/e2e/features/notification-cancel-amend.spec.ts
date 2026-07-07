import { test, expect } from '@fixtures';
import { createPageObjects } from '@page-objects';
import { CPH_NUMBER, Journeys, type JourneyContext } from '@flows/journeys';

const EDITED_CPH_NUMBER = '987654321';

test.describe('Notification cancel amend', () => {
  test.describe('cancel amend button and confirmation page', () => {
    let referenceNumber: string;

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const pages = createPageObjects(page);
      const journeyContext: JourneyContext = {};
      const journeys = new Journeys(pages, journeyContext);
      await journeys.submitNotification();
      referenceNumber = journeyContext.notificationId;
      await journeys.amendNotification(referenceNumber);
      await context.close();
    });

    test.beforeEach(async ({ journeys }) => {
      await journeys.toNotificationView(referenceNumber);
    });

    test('shows the Cancel amendment option when notification is in Amend status', async ({ pages }) => {
      await expect(pages.notificationView.amendStatusTag).toBeVisible();
      await expect(pages.notificationView.btnCancelAmend).toBeVisible();
    });

    test('does not show the Cancel amendment option when notification is Submitted', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const pages = createPageObjects(page);
      const journeyContext: JourneyContext = {};
      const journeys = new Journeys(pages, journeyContext);
      await journeys.submitNotification();
      const submittedReference = journeyContext.notificationId;
      await journeys.toNotificationView(submittedReference);

      await expect(pages.notificationView.btnCancelAmend).not.toBeVisible();
      await expect(pages.notificationView.btnAmend).toBeVisible();

      await context.close();
    });

    test('shows the confirmation page when Cancel amendment is selected', async ({ pages }) => {
      await pages.notificationView.btnCancelAmend.click();

      await expect(pages.page).toHaveURL(new RegExp(pages.notificationCancelAmend.expectedUrl(referenceNumber)));
      await expect(pages.notificationCancelAmend.heading).toBeVisible();
      await expect(pages.notificationCancelAmend.confirmationQuestion).toBeVisible();
      await expect(pages.notificationCancelAmend.btnYesCancelAmendment).toBeVisible();
      await expect(pages.notificationCancelAmend.btnNoReturnToNotification).toBeVisible();
    });

    test('returns to the notification view without cancelling when No is selected', async ({ pages }) => {
      await pages.notificationCancelAmend.open(referenceNumber);
      await pages.notificationCancelAmend.btnNoReturnToNotification.click();

      await expect(pages.page).toHaveURL(new RegExp(pages.notificationView.expectedUrl(referenceNumber)));
      await expect(pages.notificationView.amendStatusTag).toBeVisible();
      await expect(pages.notificationView.btnCancelAmend).toBeVisible();
      await expect(pages.notificationView.changeLink('County Parish Holding number (CPH)')).toBeVisible();
    });
  });

  test(
    'cancels the amendment and restores the submitted notification',
    { tag: ['@integration'] },
    async ({ pages, journeys, journeyContext }) => {
      await journeys.submitNotification();
      const referenceNumber = journeyContext.notificationId;

      await journeys.amendNotification(referenceNumber);
      await expect(pages.notificationView.summaryValue('County Parish Holding number (CPH)')).toHaveText(CPH_NUMBER);

      await pages.notificationView.changeLink('County Parish Holding number (CPH)').click();
      await pages.cphNumber.inputCphNumber.fill(EDITED_CPH_NUMBER);
      await pages.cphNumber.btnSaveAndContinue.click();
      await expect(pages.addresses.heading).toBeVisible();
      await expect(pages.addresses.cphNumber).toContainText(EDITED_CPH_NUMBER);

      await journeys.toNotificationView(referenceNumber);
      await expect(pages.notificationView.summaryValue('County Parish Holding number (CPH)')).toHaveText(EDITED_CPH_NUMBER);

      await pages.notificationView.btnCancelAmend.click();
      await pages.notificationCancelAmend.btnYesCancelAmendment.click();

      await expect(pages.notificationView.amendCancelledBanner).toBeVisible();
      await expect(pages.notificationView.amendCancelledBanner).toContainText('The amendment has been cancelled');

      await expect(pages.page).toHaveURL(new RegExp(`${pages.notificationView.expectedUrl(referenceNumber)}(\\?cancelled=1)?$`), {
        timeout: 10000,
      });

      await expect(pages.notificationView.amendStatusTag).not.toBeVisible();
      await expect(pages.notificationView.btnCancelAmend).not.toBeVisible();
      await expect(pages.notificationView.btnAmend).toBeVisible();
      await expect(pages.notificationView.changeLink('Where is this consignment coming from?')).not.toBeVisible();
      await expect(pages.notificationView.summaryValue('County Parish Holding number (CPH)')).toHaveText(CPH_NUMBER);
    },
  );
});
