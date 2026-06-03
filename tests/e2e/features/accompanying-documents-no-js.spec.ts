import { test, expect } from '@fixtures';
import { fileUploadPaths, fileUploadNames } from '@resources/file-upload/paths';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';
import { timeouts } from '@config/timeouts';

test.describe('Accompanying documents - without JavaScript', { tag: ['@integration', '@no-js'] }, () => {
  test.use({ javaScriptEnabled: false });

  test('shows manual refresh link instead of polling when virus scan is pending', async ({ pages, journeys }) => {
    await journeys.toAccompanyingDocuments();

    await test.step('upload a document', async () => {
      await pages.accompanyingDocuments.fillTextFields();
      await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fileUploadPaths.safeFile250bPng);
      await pages.accompanyingDocuments.btnAddAttachment.click();
      await expect(pages.accompanyingDocuments.documentsList).toBeVisible({
        timeout: fileUploadTimeouts.documentsListVisible,
      });
    });

    await test.step('manually refresh until scan is complete', async () => {
      const statusTag = pages.accompanyingDocuments.getStatusTag(fileUploadNames.safeFile250bPng);
      const refreshLink = pages.accompanyingDocuments.linkRefreshVirusScanStatus;

      await expect(statusTag).toHaveText(/Checking|Safe/);

      // Without JavaScript, the refresh link is shown on the page while the scan is still running.
      // With JavaScript, the link is hidden on load and the page polls automatically while the scan is still running — here we click the link to reload the page instead.
      await expect
        .poll(
          async () => {
            const status = (await statusTag.innerText()).trim();
            if (status !== 'Safe' && (await refreshLink.isVisible())) {
              await refreshLink.click({ timeout: timeouts.short });
              await pages.page.waitForLoadState('load');
            }
            return (await statusTag.innerText()).trim();
          },
          { timeout: fileUploadTimeouts.virusScanComplete, intervals: [timeouts.short] },
        )
        .toBe('Safe');
    });

    await test.step('refresh link is not shown once scan is complete', async () => {
      await expect(pages.accompanyingDocuments.linkRefreshVirusScanStatus).toHaveCount(0);
    });
  });
});
