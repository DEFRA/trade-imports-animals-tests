import { test, expect } from '@fixtures';

test.describe('Country of origin — accessible-autocomplete enhancement', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('combobox renders, typing filters, selection submits and persists', async ({ journey, pages }) => {
    await journey.startNotification();
    await pages.overview.task('Where is this consignment coming from?').click();

    // The enhancement swaps the visible affordance to a combobox input while the
    // select stays in the DOM (renamed) as the control that submits. The
    // input-scoped locator waits for the mount; the role and accessible-name pins
    // then assert the a11y contract the raw select used to provide.
    const combo = pages.originOfImport.countryOfOrigin;
    await expect(combo).toBeVisible();
    await expect(combo).toHaveRole('combobox');
    await expect(combo).toHaveAccessibleName('Country of origin');
    const select = pages.page.locator('select#countryOfOrigin-select');
    await expect(select).toBeAttached();
    await expect(select).toBeHidden();

    // Typing filters the country list mid-word; non-matches drop out.
    await combo.fill('ran');
    await expect(pages.page.getByRole('option', { name: 'France' })).toBeVisible();
    await expect(pages.page.getByRole('option', { name: 'Belgium' })).toHaveCount(0);

    // The select's placeholder and divider rows never surface as suggestions.
    await combo.fill('');
    await combo.press('ArrowDown');
    await expect(pages.page.getByRole('option', { name: 'Austria' })).toBeVisible();
    await expect(pages.page.getByRole('option', { name: 'Select a country' })).toHaveCount(0);
    await expect(pages.page.getByRole('option', { name: '──────────' })).toHaveCount(0);

    // Selecting a suggestion syncs the select; the save round-trips it.
    await pages.originOfImport.selectCountry('France');
    await expect(select).toHaveValue('FR');
    await pages.originOfImport.radioRequiresOriginCode('No').check();
    await pages.originOfImport.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();

    await pages.overview.task('Where is this consignment coming from?').click();
    await expect(combo).toHaveValue('France');
    await expect(select).toHaveValue('FR');
  });
});
