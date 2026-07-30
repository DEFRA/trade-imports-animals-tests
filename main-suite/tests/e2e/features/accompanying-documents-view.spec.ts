import path from 'path';
import { promises as fs } from 'fs';
import { test, expect } from '@main-fixtures';
import { writeEicarPdfFile } from '@main-utils/eicar-file-writer';
import { fileUploadPaths, fileUploadNames } from '@main-resources/file-upload/paths';
import { fileUploadTimeouts } from '@main-config/file-upload-timeouts';

test.describe('Accompanying documents - view file', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('accompanyingDocuments');
    await apiJourney.resumeInUi(created.referenceNumber, pages.accompanyingDocuments);
  });

  test('view file link downloads the uploaded file when the scan is complete', { tag: ['@integration'] }, async ({ pages }) => {
    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REFVIEW' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fileUploadPaths.safeFile250bPng);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.accompanyingDocuments.getStatusTag(fileUploadNames.safeFile250bPng)).toHaveText('Safe', {
      timeout: fileUploadTimeouts.virusScanComplete,
    });

    const viewLink = pages.accompanyingDocuments.getViewFileLink(fileUploadNames.safeFile250bPng);
    await expect(viewLink).toBeVisible();

    const [download] = await Promise.all([pages.page.waitForEvent('download'), viewLink.click()]);

    expect(download.suggestedFilename()).toBe(fileUploadNames.safeFile250bPng);

    // Filename alone does not prove content integrity — compare bytes against the original upload.
    const downloadedPath = await download.path();
    const [downloadedBytes, originalBytes] = await Promise.all([fs.readFile(downloadedPath), fs.readFile(fileUploadPaths.safeFile250bPng)]);
    expect(downloadedBytes.equals(originalBytes)).toBe(true);
  });

  test('view file link is not rendered when the scan rejects the file', { tag: ['@integration'] }, async ({ pages }, testInfo) => {
    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REFVIRUS' });
    const eicarFile = await writeEicarPdfFile(path.join(testInfo.outputDir, 'file-upload'));
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(eicarFile.filePath);
    await pages.accompanyingDocuments.btnAddAttachment.click();
    await expect(pages.accompanyingDocuments.documentsList).toBeVisible({ timeout: fileUploadTimeouts.documentsListVisible });

    await expect(pages.accompanyingDocuments.getStatusTag(eicarFile.fileName)).toHaveText('Virus found', {
      timeout: fileUploadTimeouts.virusScanComplete,
    });

    // Infected uploads stay removable but must not be downloadable.
    await expect(pages.accompanyingDocuments.getBtnRemove(eicarFile.fileName)).toBeVisible();
    await expect(pages.accompanyingDocuments.getViewFileLink(eicarFile.fileName)).toHaveCount(0);
  });
});
