import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { test, expect } from '@fixtures';
import { writeEicarPdfFile } from '@utils/eicar-file-writer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fixturePath = path.join(__dirname, '../../../resources/file-upload/test-document.pdf');

const UPLOAD_RENDER_TIMEOUT_MS = 10000;
const VIRUS_SCAN_TIMEOUT_MS = 30000;

test.describe('Accompanying documents - view file', () => {
  test('View file link downloads the uploaded file when the scan is complete', { tag: ['@integration'] }, async ({ pages, journeys }) => {
    await journeys.toAccompanyingDocuments();

    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REFVIEW' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fixturePath);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    // Wait for scan to complete
    await expect(pages.accompanyingDocuments.btnContinueEnabled).toBeVisible({ timeout: VIRUS_SCAN_TIMEOUT_MS });
    await expect(pages.accompanyingDocuments.getStatusTag('test-document.pdf')).toHaveText('Safe');

    const viewLink = pages.accompanyingDocuments.getViewFileLink('test-document.pdf');
    await expect(viewLink).toBeVisible();

    const [download] = await Promise.all([pages.page.waitForEvent('download'), viewLink.click()]);

    expect(download.suggestedFilename()).toBe('test-document.pdf');

    // Bytes round-trip cleanly through the frontend stream
    const downloadedPath = await download.path();
    const [downloadedBytes, originalBytes] = await Promise.all([fs.readFile(downloadedPath), fs.readFile(fixturePath)]);
    expect(downloadedBytes.equals(originalBytes)).toBe(true);
  });

  test(
    'View file link is not rendered when the scan rejects the file',
    { tag: ['@integration'] },
    async ({ pages, journeys }, testInfo) => {
      await journeys.toAccompanyingDocuments();

      await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REFVIRUS' });
      const eicarFile = await writeEicarPdfFile(path.join(testInfo.outputDir, 'file-upload'));
      await pages.accompanyingDocuments.inputFileUpload.setInputFiles(eicarFile.filePath);
      await pages.accompanyingDocuments.btnAddAttachment.click();
      await expect(pages.accompanyingDocuments.documentsList).toBeVisible({ timeout: UPLOAD_RENDER_TIMEOUT_MS });

      await expect(pages.accompanyingDocuments.getStatusTag(eicarFile.fileName)).toHaveText('Virus found', {
        timeout: VIRUS_SCAN_TIMEOUT_MS,
      });

      // Remove and View file are mutually exclusive of the rejected state — Remove stays, View file does not
      await expect(pages.accompanyingDocuments.getBtnRemove(eicarFile.fileName)).toBeVisible();
      await expect(pages.accompanyingDocuments.getViewFileLink(eicarFile.fileName)).toHaveCount(0);
    },
  );
});
