import { test, expect } from '@fixtures';

test.describe('Arrival details page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toArrivalDetails();
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.arrivalDetails.heading).toBeVisible();
    await expect(pages.arrivalDetails.portOfEntry).toBeVisible();
    await expect(pages.arrivalDetails.meansOfTransport).toBeVisible();
    await expect(pages.arrivalDetails.transportIdentification).toBeVisible();
    await expect(pages.arrivalDetails.transportDocumentReference).toBeVisible();
    await expect(pages.arrivalDetails.saveAndContinue).toBeVisible();
  });

  test('leaves the arrival details unanswered on load', async ({ pages }) => {
    await expect(pages.arrivalDetails.portOfEntry).toBeVisible();
    await expect(pages.arrivalDetails.meansOfTransport).toBeVisible();
  });

  test('accepts valid arrival details', async ({ journey, pages }) => {
    await journey.fillArrivalDetails();
    await pages.arrivalDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('shows an error summary when submitted empty', async ({ pages }) => {
    await pages.arrivalDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});
