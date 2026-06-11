import path from 'path';
import { test, expect } from '@fixtures';
import { fileUploadPaths, fileUploadNames } from '@resources/file-upload/paths';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';
import { timeouts } from '@config/timeouts';
import { writeSyntheticFile } from '@utils/synthetic-file-writer';

/** App-enforced cap is 10 MB decimal — matches the user-facing "10 MB" hint. */
const TEN_MB_BYTES = 10 * 1000 * 1000;

/**
 * Above the Hapi route payload cap (10 MB file cap + 1024 B multipart headroom) but below the
 * 10 MiB (10,485,760 B) CDP nginx ingress cap, so Hapi's Boom 413 rejection — and the
 * onPreResponse re-render — fires deterministically in both Compose and CDP.
 */
const ABOVE_PAYLOAD_CAP_BYTES = 10_200_000;

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
  // server — this exercises the payload-length validation in the route handler, which the
  // JS-enabled size-limit tests never hit. The file is one byte over the 10 MB file cap but
  // (with its multipart envelope) still inside the route payload cap's 1024-byte headroom,
  // so the request parses and the controller renders the inline error.
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

  // A payload above the route cap is rejected by Hapi with Boom 413 before the handler runs;
  // the route's onPreResponse ext re-renders the upload page with the inline error and a
  // valid crumb (the 413 fires before crumb's onPostAuth, so the ext must supply one itself).
  test('rejects a file above the route payload cap by re-rendering the page with an inline error', async ({
    pages,
    journeys,
  }, testInfo) => {
    await journeys.toAccompanyingDocuments();

    const file = await writeSyntheticFile(path.join(testInfo.outputDir, 'file-upload'), 'above-payload-cap-no-js.pdf', {
      bytes: ABOVE_PAYLOAD_CAP_BYTES,
    });

    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'OVERPAYLOADNOJS01' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(file.filePath);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.documentsList).not.toBeVisible();
    await expect(pages.accompanyingDocuments.errorFile).toContainText(OVERSIZE_FILE_MESSAGE);
    await expect(pages.accompanyingDocuments.errorSummaryItems.filter({ hasText: OVERSIZE_FILE_MESSAGE })).toHaveCount(1);

    await test.step('re-rendered form carries a usable crumb — a follow-up upload succeeds', async () => {
      await pages.accompanyingDocuments.fillTextFields({ documentReference: 'OVERPAYLOADNOJS02' });
      await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fileUploadPaths.safeFile250bPng);
      await pages.accompanyingDocuments.btnAddAttachment.click();
      await expect(pages.accompanyingDocuments.documentsList).toBeVisible({
        timeout: fileUploadTimeouts.documentsListVisible,
      });
    });
  });
});
