import { test, expect } from '@fixtures';

test.describe('Transporter selection page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const { referenceNumber } = await apiJourney.createUpToPage('transporter');
    await apiJourney.resumeInUi(referenceNumber, pages.transporterSelection);
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.transporterSelection.heading).toBeVisible();
    await expect(pages.transporterSelection.transporter('García Livestock Transport SL')).toBeVisible();
    await expect(pages.transporterSelection.saveAndContinue).toBeVisible();
  });

  test('leaves the transporter unchecked on load', async ({ pages }) => {
    await expect(pages.transporterSelection.transporter('García Livestock Transport SL')).not.toBeChecked();
  });

  test('accepts a valid transporter', async ({ pages }) => {
    await pages.transporterSelection.transporter('García Livestock Transport SL').check();
    await pages.transporterSelection.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });
});
