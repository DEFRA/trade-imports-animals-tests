import { test, expect } from '@fixtures';

test.describe('Import purpose page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ liveAnimalsJourney: journey }) => {
    await journey.toImportPurpose();
  });

  test('renders the page controls', async ({ liveAnimalsPages: pages }) => {
    await expect(pages.importPurpose.heading).toBeVisible();
    await expect(pages.importPurpose.purpose('Breeding')).toBeVisible();
    await expect(pages.importPurpose.saveAndContinue).toBeVisible();
  });

  test('leaves the import purpose unchecked on load', async ({ liveAnimalsPages: pages }) => {
    await expect(pages.importPurpose.purpose('Breeding')).not.toBeChecked();
  });

  test('accepts a valid import purpose', async ({ liveAnimalsPages: pages }) => {
    await pages.importPurpose.purpose('Breeding').check();
    await pages.importPurpose.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });
});
