import { test, expect } from '@fixtures';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';
import { fileUploadPaths } from '@resources/file-upload/paths';

const issueDate = '03/01/2026';

test.describe('Documents scan refresh without JavaScript', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.use({ javaScriptEnabled: false });

  test('the refresh fallback reflects scan progress without client JavaScript', async ({
    liveAnimalsJourney: journey,
    liveAnimalsPages: pages,
  }) => {
    test.slow();
    await journey.startNotification();

    await pages.overview.task('Where is this consignment coming from?').click();
    await pages.page.getByLabel('Country of origin').selectOption('FR');
    await pages.page.getByRole('radio', { name: 'No' }).check();
    await pages.page.getByRole('button', { name: 'Save and continue' }).click();
    await expect(pages.overview.heading).toBeVisible();

    await journey.answerCommodity();
    await pages.overview.task('Uploaded documents').click();
    await expect(pages.accompanyingDocuments.heading).toBeVisible();

    const reference = `PWNOJS${Date.now()}`;
    await pages.accompanyingDocuments.fillDocument(reference, issueDate, fileUploadPaths.safeFile1kbPdf);
    await pages.accompanyingDocuments.saveAndAddAnother.click();

    const row = pages.accompanyingDocuments.documentRow(reference);
    await expect(row).toContainText('Checking');
    await expect(pages.accompanyingDocuments.refreshStatus).toBeVisible();
    await expect(pages.accompanyingDocuments.refreshStatus).toHaveAttribute('href', /attempt=1/);

    await expect
      .poll(
        async () => {
          await pages.accompanyingDocuments.refreshStatus.click();
          return row.textContent();
        },
        { timeout: fileUploadTimeouts.virusScanComplete },
      )
      .toContain('Safe');

    await expect(pages.accompanyingDocuments.refreshStatus).toHaveCount(0);
    await expect(pages.accompanyingDocuments.viewFile(1)).toBeVisible();
  });
});
