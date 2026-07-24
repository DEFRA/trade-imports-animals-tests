import path from 'path';
import { test, expect } from '@fixtures';
import { FIFTY_MB_BYTES } from '@resources/file-upload/constants';
import { writeSyntheticFile } from '@utils/synthetic-file-writer';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

test.describe('Accompanying documents - large uploads', { tag: '@integration' }, () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('accompanyingDocuments');
    await apiJourney.resumeInUi(created.referenceNumber, pages.accompanyingDocuments);
  });

  // AC5 target: proves the new browser → /upload-and-scan → cdp-uploader flow supports 50 MB.
  // Red under baseline (nginx sidecar rejects at 10 M cap); green once the form action moves
  // to /upload-and-scan/<uploadId>.
  test('uploads a 50 MB file successfully via the /upload-and-scan flow', { tag: '@slow' }, async ({ pages }, testInfo) => {
    test.slow();

    const file = await writeSyntheticFile(path.join(testInfo.outputDir, 'file-upload'), 'target-50mb.pdf', {
      bytes: FIFTY_MB_BYTES,
    });

    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'TARGET50MB01' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(file.filePath);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.accompanyingDocuments.documentsList).toBeVisible({
      timeout: fileUploadTimeouts.documentsListVisible,
    });
    await expect(pages.accompanyingDocuments.getStatusTag(file.fileName)).toHaveText('Safe', {
      timeout: fileUploadTimeouts.virusScanComplete * 2,
    });
  });
});
