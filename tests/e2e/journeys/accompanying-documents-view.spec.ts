import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { test, expect } from '@fixtures';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fixturePath = path.join(__dirname, '../../fixtures/test-document.pdf');
const virusFixturePath = path.join(__dirname, '../../fixtures/test-virus-document.pdf');

test.describe('accompanying documents — View file', () => {
  test('View file link downloads the uploaded file when the scan is complete', { tag: ['@integration'] }, async ({ pages, journeys }) => {
    await journeys.toAccompanyingDocuments();

    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REFVIEW' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fixturePath);
    await pages.accompanyingDocuments.btnUploadDocument.click();
    await expect(pages.accompanyingDocuments.documentsList).toBeVisible({ timeout: 10000 });

    // Wait for scan to complete
    await expect(pages.accompanyingDocuments.btnContinueEnabled).toBeVisible({ timeout: 30000 });
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

  test('View file link is not rendered when the scan rejects the file', { tag: ['@integration'] }, async ({ pages, journeys }) => {
    await journeys.toAccompanyingDocuments();

    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REFVIRUS' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(virusFixturePath);
    await pages.accompanyingDocuments.btnUploadDocument.click();
    await expect(pages.accompanyingDocuments.documentsList).toBeVisible({ timeout: 10000 });

    await expect(pages.accompanyingDocuments.getStatusTag('test-virus-document.pdf')).toHaveText('Virus found', {
      timeout: 30000,
    });

    // Remove and View file are mutually exclusive of the rejected state — Remove stays, View file does not
    await expect(pages.accompanyingDocuments.getBtnRemove('test-virus-document.pdf')).toBeVisible();
    await expect(pages.accompanyingDocuments.getViewFileLink('test-virus-document.pdf')).toHaveCount(0);
  });
});
