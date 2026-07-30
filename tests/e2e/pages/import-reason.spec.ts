import { test, expect } from '@fixtures';

test.describe('Import reason page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toImportReason();
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.importReason.heading).toBeVisible();
    await expect(pages.importReason.reason('Internal market')).toBeVisible();
    await expect(pages.importReason.saveAndContinue).toBeVisible();
  });

  test('leaves the import reason unchecked on load', async ({ pages }) => {
    await expect(pages.importReason.reason('Internal market')).not.toBeChecked();
  });

  test('accepts a valid import reason', async ({ pages }) => {
    await pages.importReason.reason('Internal market').check();
    await pages.importReason.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });
});
