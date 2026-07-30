import { test, expect } from '@fixtures';

test.describe('Task-page exits', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('Cancel and return to hub discards typed input; Save and return to hub commits and lands on the hub', async ({ journey, pages }) => {
    await journey.startNotification();

    const originRow = pages.page.locator('.govuk-task-list__item', {
      hasText: 'Where is this consignment coming from?',
    });

    // Cancel leg: choose a country, cancel — nothing is written.
    await pages.overview.task('Where is this consignment coming from?').click();
    await pages.originOfImport.selectCountry('Belgium');
    await pages.page.getByRole('link', { name: 'Cancel and return to hub' }).click();
    await expect(pages.overview.heading).toBeVisible();
    await expect(originRow).toContainText('Not yet started');

    await pages.overview.task('Where is this consignment coming from?').click();
    // Unselected state: the enhancement seeds the visible input from the
    // selected option's text — the placeholder — while the hidden select
    // (the data truth) stays empty: nothing was committed.
    await expect(pages.page.locator('input#countryOfOrigin')).toHaveValue('Select a country');
    await expect(pages.page.locator('#countryOfOrigin-select')).toHaveValue('');

    // Save-and-return leg: the named secondary submit commits the page and
    // redirects to the hub instead of the next flow target.
    await pages.originOfImport.selectCountry('France');
    await pages.page.getByRole('button', { name: 'Save and return to hub' }).click();
    await expect(pages.overview.heading).toBeVisible();
    await expect(originRow).toContainText('In progress');

    // The committed value is there on re-entry: the autocomplete input shows
    // the country name, the underlying select holds the stored code.
    await pages.overview.task('Where is this consignment coming from?').click();
    await expect(pages.page.locator('input#countryOfOrigin')).toHaveValue('France');
    await expect(pages.page.locator('#countryOfOrigin-select')).toHaveValue('FR');
  });
});
