import { test, expect } from '@fixtures';

test.describe('Security scan (frontend)', { tag: '@security' }, () => {
  test('routes the notification journey through the ZAP proxy', async ({ journey, pages, journeyContext }) => {
    test.slow();
    await journey.submitNotification();

    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();
    await expect(pages.page).toHaveURL(new RegExp(`/notifications/${journeyContext.journeyId}/confirmation$`));
  });
});
