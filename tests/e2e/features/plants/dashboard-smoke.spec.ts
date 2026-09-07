import { test, expect } from '@fixtures';

test.describe('High-risk plants dashboard', { tag: '@integration' }, () => {
  test('renders the plants dashboard after signing in', { tag: '@smoke' }, async ({ pages }) => {
    await pages.plantsDashboard.open();

    await expect(pages.page).toHaveURL(pages.plantsDashboard.expectedUrl);
    await expect(pages.plantsDashboard.heading).toBeVisible();
    await expect(pages.plantsDashboard.btnStartNewNotification).toBeVisible();
    await expect(pages.plantsDashboard.errorSummary).not.toBeVisible();
  });
});
