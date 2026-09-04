import { test, expect } from '@fixtures';

test.describe('CPH number page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const { referenceNumber } = await apiJourney.createUpToPage('addresses');
    await apiJourney.resumeInUi(referenceNumber, pages.cphNumber);
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.cphNumber.heading).toBeVisible();
    await expect(pages.cphNumber.cphNumber).toBeVisible();
    await expect(pages.cphNumber.saveAndContinue).toBeVisible();
  });

  test('leaves the CPH number empty on load', async ({ pages }) => {
    await expect(pages.cphNumber.cphNumber).toHaveValue('');
  });

  test('accepts a valid CPH number', async ({ pages }) => {
    await pages.cphNumber.cphNumber.fill('12/345/6789');
    await pages.cphNumber.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('shows an error summary when submitted empty', async ({ pages }) => {
    test.slow();

    await pages.cphNumber.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});
