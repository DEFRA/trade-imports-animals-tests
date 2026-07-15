import path from 'path';
import { test, expect } from '@fixtures';
import { TEN_MB_BYTES, OVERSIZE_FILE_MESSAGE } from '@resources/file-upload/constants';
import { skipIfComposeEnvironment } from '@utils/playwright/environment';
import { writeSyntheticFile } from '@utils/synthetic-file-writer';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

// Above the 10 MiB CDP nginx ingress cap, to prove the client preflight blocks a raw 413.
const ELEVEN_MIB_BYTES = 11 * 1024 * 1024;

test.describe('Accompanying documents - file size limit', { tag: '@integration' }, () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('accompanyingDocuments');
    await apiJourney.resumeInUi(created.referenceNumber, pages.accompanyingDocuments);
  });

  test('accepts a file at the 10 MB cap and completes virus scan', { tag: '@slow' }, async ({ pages }, testInfo) => {
    const file = await writeSyntheticFile(path.join(testInfo.outputDir, 'file-upload'), 'at-cap.pdf', {
      bytes: TEN_MB_BYTES,
    });

    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'ATCAP01' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(file.filePath);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.accompanyingDocuments.documentsList).toBeVisible({
      timeout: fileUploadTimeouts.documentsListVisible,
    });
    await expect(pages.accompanyingDocuments.getStatusTag(file.fileName)).toHaveText(/Checking|Safe/);
    await expect(pages.accompanyingDocuments.getStatusTag(file.fileName)).toHaveText('Safe', {
      timeout: fileUploadTimeouts.virusScanComplete * 2,
    });
  });

  test('rejects a file one byte over the 10 MB cap with an inline error and no navigation', async ({ pages }, testInfo) => {
    const file = await writeSyntheticFile(path.join(testInfo.outputDir, 'file-upload'), 'one-byte-over.pdf', {
      bytes: TEN_MB_BYTES + 1,
    });

    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'OVER10MB01' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(file.filePath);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.documentsList).not.toBeVisible();
    await expect(pages.accompanyingDocuments.errorFile).toContainText(OVERSIZE_FILE_MESSAGE);
    await expect(pages.accompanyingDocuments.errorSummaryItems.filter({ hasText: OVERSIZE_FILE_MESSAGE })).toHaveCount(1);
  });

  test('keeps the user on the upload page (not a raw nginx 413) when file exceeds the CDP infra cap', async ({ pages }, testInfo) => {
    skipIfComposeEnvironment('CDP-only regression: Compose stack has no nginx ingress in front of the frontend pod.');

    const file = await writeSyntheticFile(path.join(testInfo.outputDir, 'file-upload'), 'over-nginx.pdf', {
      bytes: ELEVEN_MIB_BYTES,
    });

    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'OVERNGINX01' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(file.filePath);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.page).not.toHaveTitle(/413 Request Entity Too Large/);
    await expect(pages.accompanyingDocuments.errorFile).toContainText(OVERSIZE_FILE_MESSAGE);
  });
});
