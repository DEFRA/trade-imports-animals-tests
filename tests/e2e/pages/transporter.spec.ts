import { test, expect } from '@fixtures';

test.describe('Transporter page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const { referenceNumber } = await apiJourney.createUpToPage('transitedCountries');
    await apiJourney.resumeInUi(referenceNumber, pages.transporter);
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.transporter.heading).toBeVisible();
    await expect(pages.transporter.transporterType('Commercial')).toBeVisible();
    await expect(pages.transporter.saveAndContinue).toBeVisible();
  });

  test('leaves the transporter type unchecked on load', async ({ pages }) => {
    await expect(pages.transporter.transporterType('Commercial')).not.toBeChecked();
  });

  test('accepts a valid transporter type', async ({ pages }) => {
    await pages.transporter.transporterType('Commercial').check();
    await pages.transporter.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });
});
