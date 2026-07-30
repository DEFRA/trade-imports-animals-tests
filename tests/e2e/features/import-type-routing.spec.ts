import { test, expect } from '@fixtures';

test.describe('Import type routing', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('a blank answer blocks Continue, a non-live-animals answer routes to the holding page, live animals opens the run', async ({
    pages,
  }) => {
    // The entry filter is the service front door: Start a new notification
    // lands straight on it.
    await pages.notificationDashboard.open();
    await pages.notificationDashboard.heading.waitFor();
    await pages.notificationDashboard.btnCreateNewNotification.click();
    await expect(pages.importType.heading).toBeVisible();
    const journeyId = pages.importType.journeyIdFromUrl();

    // importType is required to enter the service — a blank Continue fails.
    await pages.importType.continueButton.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: 'Select what you are importing' })).toBeVisible();

    // A non-live-animals type routes to the not-available holding page.
    await pages.page.getByRole('radio', { name: 'Products of animal origin or animal by-products' }).check();
    await pages.importType.continueButton.click();
    await expect(pages.page.getByRole('heading', { name: 'You cannot use this service' })).toBeVisible();

    // The holding page offers a way back to change the answer.
    await pages.page.getByRole('link', { name: 'Go back and change your answer' }).click();
    await expect(pages.importType.heading).toBeVisible();

    // Live animals opens the linear run at origin, and the answer persists on
    // return to the filter.
    await pages.importType.liveAnimals.check();
    await pages.importType.continueButton.click();
    await expect(pages.originOfImport.heading).toBeVisible();

    await pages.importType.open(journeyId);
    await expect(pages.importType.liveAnimals).toBeChecked();
  });
});
