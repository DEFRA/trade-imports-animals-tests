import { test, expect } from '@fixtures';

test.describe('Country of origin plain select', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('renders all options, submits the country code and persists it', async ({ journey, pages }) => {
    await journey.startNotification();
    await pages.overview.task('Where is this consignment coming from?').click();

    const select = pages.originOfImport.countryOfOrigin;
    await expect(select).toBeVisible();
    await expect(select).toHaveRole('combobox');
    await expect(select).toHaveAccessibleName('Country of origin');
    await expect(select.locator('option').first()).toHaveText('Select a country');
    await expect(select.locator('option')).toHaveCount(33);

    await pages.originOfImport.selectCountry('Belgium');
    await expect(select).toHaveValue('BE');
    await pages.originOfImport.radioRequiresOriginCode('No').check();
    await pages.originOfImport.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();

    await pages.overview.task('Where is this consignment coming from?').click();
    await expect(select).toHaveValue('BE');
  });
});
