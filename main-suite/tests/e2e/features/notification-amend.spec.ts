import { expect, test } from '@main-fixtures';
import { sortByValues } from '@main-domain/constants/sort-by-values';

test.describe('Notification amend', () => {
  test.afterEach(async ({ journeyContext, notificationActions }) => {
    if (journeyContext.referenceNumber) {
      await notificationActions.deleteNotification(journeyContext.referenceNumber);
    }
  });

  test.describe('amend entry points', () => {
    test.beforeEach(async ({ apiJourney, notificationActions }) => {
      const created = await apiJourney.createSubmittedNotification();
      await notificationActions.toNotificationView(created.referenceNumber);
    });

    test('shows the Amend button on the notification view page when SUBMITTED', async ({ pages }) => {
      await expect(pages.notificationView.btnAmend).toBeVisible();
    });

    test('shows the Amend action on the dashboard for the SUBMITTED notification', async ({ pages, journeyContext }) => {
      await pages.notificationDashboard.open();
      await pages.notificationDashboard.sortBy(sortByValues.dateCreatedNewestToOldest);
      await expect(pages.notificationDashboard.btnAmend(journeyContext.referenceNumber)).toBeVisible();
    });
  });

  test(
    'amends from the view page and shows Change links + CTAs',
    { tag: ['@integration'] },
    async ({ pages, apiJourney, journeyContext, notificationActions }) => {
      const created = await apiJourney.createSubmittedNotification();
      const ref = created.referenceNumber ?? journeyContext.referenceNumber;

      await notificationActions.toNotificationView(ref);
      await pages.notificationView.btnAmend.click();

      // status pill is "Amend" and a Change link is shown per section
      await expect(pages.notificationView.amendStatusTag).toBeVisible();
      await expect(pages.notificationView.changeLink('Where is this consignment coming from?')).toBeVisible();
      await expect(pages.notificationView.changeLink('Your commodities')).toBeVisible();
      await expect(pages.notificationView.changeLink('Addresses')).toBeVisible();
      await expect(pages.notificationView.changeLink('Transport details')).toBeVisible();

      // AC4: Copy as new + Delete CTAs are visible on the AMEND view
      await expect(pages.notificationView.btnCopyAsNew).toBeVisible();
      await expect(pages.notificationView.btnDelete).toBeVisible();
    },
  );

  test(
    'amends from the dashboard and lands on the view page in AMEND state',
    { tag: ['@integration'] },
    async ({ pages, apiJourney, journeyContext }) => {
      const created = await apiJourney.createSubmittedNotification();
      const ref = created.referenceNumber ?? journeyContext.referenceNumber;

      await pages.notificationDashboard.open();
      await pages.notificationDashboard.sortBy(sortByValues.dateCreatedNewestToOldest);
      await pages.notificationDashboard.btnAmend(ref).click();

      // Lands on /notification-view/{ref} with AMEND state
      await expect(pages.notificationView.heading).toBeVisible();
      await expect(pages.notificationView.amendStatusTag).toBeVisible();
    },
  );

  test(
    'walks the full amend lifecycle: SUBMITTED → AMEND → SUBMITTED',
    { tag: ['@integration'] },
    async ({ pages, apiJourney, journeyContext, notificationActions }) => {
      // 1. Start from a freshly submitted notification.
      const created = await apiJourney.createSubmittedNotification();
      const ref = created.referenceNumber ?? journeyContext.referenceNumber;

      await notificationActions.toNotificationView(ref);
      await expect(pages.notificationView.btnAmend).toBeVisible();
      await expect(pages.notificationView.amendStatusTag).not.toBeVisible();

      // 2. Enter amend mode (SUBMITTED → AMEND).
      await pages.notificationView.btnAmend.click();
      await expect(pages.notificationView.amendStatusTag).toBeVisible();
      await expect(pages.notificationView.btnAmend).not.toBeVisible();

      // 3. Save the amendments — view-page CTA navigates to /declaration.
      await pages.notificationView.btnConfirmAndSubmit.click();
      await expect(pages.declaration.heading).toBeVisible();

      // 4. Confirm the declaration and submit (AMEND → SUBMITTED via the
      //    extended backend submitNotification that now accepts AMEND).
      await pages.declaration.checkboxDeclaration.click();
      await pages.declaration.btnSubmitNotification.click();

      // 5. Re-open the view page and assert we're back in SUBMITTED:
      //    the AMEND status pill is gone and the Amend CTA is offered again.
      await notificationActions.toNotificationView(ref);
      await expect(pages.notificationView.amendStatusTag).not.toBeVisible();
      await expect(pages.notificationView.btnAmend).toBeVisible();

      // And the dashboard exposes the SUBMITTED-state Amend action against
      // the same reference, confirming the round-trip.
      await pages.notificationDashboard.open();
      await pages.notificationDashboard.sortBy(sortByValues.dateCreatedNewestToOldest);
      await expect(pages.notificationDashboard.btnAmend(ref)).toBeVisible();
    },
  );
});
