import { test, expect } from '@fixtures';

test.describe('Arrival details page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('shows an error summary when submitted empty', async ({ journey, pages }) => {
    await journey.startNotification();
    await journey.unlockSections();
    await pages.overview.task('Arrival details').click();
    await pages.arrivalDetails.heading.waitFor();

    await pages.arrivalDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});
