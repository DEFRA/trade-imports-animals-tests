import { test, expect } from '@fixtures';

test.describe('Task-page exits', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('Cancel and return to hub discards typed input; Save and return to hub commits and lands on the hub', async ({
    liveAnimalsJourney: journey,
    liveAnimalsPages: pages,
  }) => {
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
    // Nothing was committed, so the server-rendered select is still empty.
    await expect(pages.originOfImport.countryOfOrigin).toHaveValue('');

    // Save-and-return leg: the named secondary submit commits the page and
    // redirects to the hub instead of the next flow target.
    await pages.originOfImport.selectCountry('France');
    await pages.page.getByRole('button', { name: 'Save and return to hub' }).click();
    await expect(pages.overview.heading).toBeVisible();
    await expect(originRow).toContainText('In progress');

    // The committed country code is there on re-entry.
    await pages.overview.task('Where is this consignment coming from?').click();
    await expect(pages.originOfImport.countryOfOrigin).toHaveValue('FR');
  });
});
