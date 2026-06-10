import path from 'path';
import { test, expect } from '@fixtures';
import { fileUploadPaths, fileUploadNames } from '@resources/file-upload/paths';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';
import { timeouts } from '@config/timeouts';
import { writeSyntheticFile } from '@utils/synthetic-file-writer';

/** App-enforced cap is 10 MB decimal — matches the user-facing "10 MB" hint. */
const TEN_MB_BYTES = 10 * 1000 * 1000;

const OVERSIZE_FILE_MESSAGE = 'The selected file must be smaller than 10 MB';

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

  // Without JavaScript there is no client-side preflight, so the oversize file reaches the
  // server — this exercises the server-side fallback (payload-length validation and the
  // route-cap 413 re-render) that the JS-enabled size-limit tests never hit.
  test('rejects a file one byte over the 10 MB cap with a server-rendered inline error', async ({ pages, journeys }, testInfo) => {
    await journeys.toAccompanyingDocuments();

    const file = await writeSyntheticFile(path.join(testInfo.outputDir, 'file-upload'), 'one-byte-over-no-js.pdf', {
      bytes: TEN_MB_BYTES + 1,
    });

    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'OVER10MBNOJS01' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(file.filePath);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.documentsList).not.toBeVisible();
    await expect(pages.accompanyingDocuments.errorFile).toContainText(OVERSIZE_FILE_MESSAGE);
    await expect(pages.accompanyingDocuments.errorSummaryItems.filter({ hasText: OVERSIZE_FILE_MESSAGE })).toHaveCount(1);
  });
});
