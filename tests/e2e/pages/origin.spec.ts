import { test, expect } from '@fixtures';

test.describe('Origin page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('shows an error summary when submitted empty', async ({ journey, pages }) => {
    await journey.startNotification();
    await pages.overview.task('Where is this consignment coming from?').click();
    await pages.originOfImport.heading.waitFor();

    await pages.originOfImport.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});
