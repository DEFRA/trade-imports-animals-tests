import { test, expect } from '@fixtures';

test.describe('Reason and purpose scope', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('purpose is owed only for the internal market and is wiped when the reason changes', async ({ journey, pages }) => {
    await journey.startNotification();
    await journey.unlockSections();

    const reasonRow = pages.page.locator('.govuk-task-list__item', { hasText: 'Main reason for importing' });

    // Internal market: the purpose page opens and completing reason + purpose + the
    // tail page completes the row.
    await pages.overview.task('Main reason for importing').click();
    await pages.importReason.reason('Internal market').check();
    await pages.importReason.saveAndContinue.click();
    await expect(pages.importPurpose.heading).toBeVisible();
    await pages.importPurpose.purpose('Breeding').check();
    await pages.importPurpose.saveAndContinue.click();
    await expect(pages.additionalDetails.heading).toBeVisible();
    await pages.additionalDetails.certifiedFor('Slaughter').check();
    await pages.additionalDetails.saveAndContinue.click();
    await expect(reasonRow).toContainText('Completed');

    // Transit: the purpose is no longer owed, but the reason-gated exit-details
    // pages (destination country + port of exit) come into scope and are
    // save-enforced, so the walk answers them before the tail page.
    await pages.overview.task('Main reason for importing').click();
    await pages.importReason.reason('Transit').check();
    await pages.importReason.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'Destination country' })).toBeVisible();
    await pages.page.getByLabel('Destination country').selectOption('FR');
    await pages.page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(pages.page.getByRole('heading', { name: 'Port of exit' })).toBeVisible();
    await pages.page.getByLabel('Port of exit').selectOption({ index: 2 });
    await pages.page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(pages.additionalDetails.heading).toBeVisible();
    await pages.additionalDetails.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();
    await expect(reasonRow).toContainText('Completed');

    // Back to the internal market: leaving scope wiped the saved purpose, so no
    // radio is pre-selected and the task is owed again.
    await pages.overview.task('Main reason for importing').click();
    await pages.importReason.reason('Internal market').check();
    await pages.importReason.saveAndContinue.click();
    await expect(pages.importPurpose.heading).toBeVisible();
    await expect(pages.page.getByRole('radio', { checked: true })).toHaveCount(0);

    // A blank purpose save is not an error (enforcedAt=submit); it walks on to the
    // tail page and leaves the task open.
    await pages.importPurpose.saveAndContinue.click();
    await expect(pages.additionalDetails.heading).toBeVisible();
    await pages.additionalDetails.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();
    await expect(reasonRow).not.toContainText('Completed');
  });
});
