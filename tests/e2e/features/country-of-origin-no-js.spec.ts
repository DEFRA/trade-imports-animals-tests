import { test, expect } from '@fixtures';

test.describe('Country of origin without JavaScript', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.use({ javaScriptEnabled: false });

  test('the plain select still submits and persists', async ({ journey, pages }) => {
    await journey.startNotification();
    await pages.overview.task('Where is this consignment coming from?').click();

    // No enhancement: the autocomplete never mounts, so the plain select carries the value.
    await expect(pages.page.locator('.autocomplete__input')).toHaveCount(0);
    await pages.page.getByLabel('Country of origin').selectOption('FR');
    await pages.page.getByRole('radio', { name: 'No' }).check();
    await pages.page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(pages.overview.heading).toBeVisible();

    // The committed value is on the select on re-entry.
    await pages.overview.task('Where is this consignment coming from?').click();
    await expect(pages.page.getByLabel('Country of origin')).toHaveValue('FR');
  });
});
