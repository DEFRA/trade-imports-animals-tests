import { test, expect } from '@fixtures';

test.describe('Security scan (frontend, lifecycle)', { tag: '@active' }, () => {
  test('routes the post-submission actions through the ZAP proxy', async ({ journey, journeyContext, pages, notificationActions }) => {
    test.slow();
    // The submission journey elsewhere in this suite stops at the confirmation
    // page, so amend and copy are unreached without this.
    await journey.submitNotification();
    const journeyId = journeyContext.journeyId;

    await notificationActions.amendNotification(journeyId);
    await expect(pages.overview.journeyStrip).toContainText('Amending');

    // Copy accepts AMEND as a source state, so leaving the notification
    // amending does not block it.
    await notificationActions.copyNotification(journeyId);
    await expect(pages.overview.heading).toBeVisible();
  });

  test('routes cancelling an amendment and deleting through the ZAP proxy', async ({
    journey,
    journeyContext,
    pages,
    notificationActions,
  }) => {
    test.slow();
    await journey.submitNotification();
    const journeyId = journeyContext.journeyId;

    await notificationActions.amendNotification(journeyId);
    await notificationActions.cancelAmend(journeyId);
    await expect(pages.notificationView.journeyStrip).toContainText('Submitted');

    await notificationActions.deleteNotification(journeyId);
  });
});
