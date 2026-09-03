import { test, expect } from '@fixtures';

test.describe('Security scan (frontend, lifecycle)', { tag: '@active' }, () => {
  test('routes the post-submission actions through the ZAP proxy', async ({ journey, journeyContext, pages, notificationActions }) => {
    test.slow();
    // The submission journey elsewhere in this suite stops at the confirmation
    // page, so amend and copy are unreached without this. Cancelling an
    // amendment and deleting are blocked by an application defect — see below.
    await journey.submitNotification();
    const journeyId = journeyContext.journeyId;

    await notificationActions.amendNotification(journeyId);
    await expect(pages.overview.journeyStrip).toContainText('Amending');

    // Copy accepts AMEND as a source state, so leaving the notification
    // amending does not block it.
    await notificationActions.copyNotification(journeyId);
    await expect(pages.overview.heading).toBeVisible();
  });

  // Blocked by EUDPA-389: cancelAmend and softDelete do not forward the
  // authenticated actor, so the backend cannot resolve address-book parties and
  // answers 400. Only bites notifications carrying party references — every one
  // submitted through the real journey, which is why the API-seeded e2e specs
  // pass. Remove the test.fail() once EUDPA-389 lands; nothing else changes.
  test.fail(
    'routes cancelling an amendment and deleting through the ZAP proxy',
    async ({ journey, journeyContext, pages, notificationActions }) => {
      test.slow();
      await journey.submitNotification();
      const journeyId = journeyContext.journeyId;

      await notificationActions.amendNotification(journeyId);
      await notificationActions.cancelAmend(journeyId);
      await expect(pages.notificationView.journeyStrip).toContainText('Submitted');

      await notificationActions.deleteNotification(journeyId);
    },
  );
});
