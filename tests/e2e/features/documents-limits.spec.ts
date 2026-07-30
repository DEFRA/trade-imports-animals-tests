import { copyFile, mkdir, stat, truncate } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@fixtures';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { TEN_MB_BYTES } from '@resources/file-upload/constants';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

const issueDate = { day: '3', month: '1', year: '2026' } as const;
const maximumDocuments = 10;
const maximumDocumentsMessage = `You can add a maximum of ${maximumDocuments} documents`;

const paddedPdf = async (destination: string, bytes: number): Promise<string> => {
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(fileUploadPaths.safeFile1kbPdf, destination);
  await truncate(destination, bytes);
  expect((await stat(destination)).size).toBe(bytes);
  return destination;
};

test.describe('Documents limits', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('accepts a tenth document and rejects an eleventh with the maximum-documents error', async ({ journey, pages }) => {
    test.slow();
    await journey.toAccompanyingDocuments();

    for (let index = 1; index <= maximumDocuments; index += 1) {
      const reference = `PWCAP${Date.now()}${index}`;
      await pages.accompanyingDocuments.fillDocument(reference, issueDate, fileUploadPaths.safeFile1kbPdf);
      await pages.accompanyingDocuments.saveAndAddAnother.click();
      await expect(pages.accompanyingDocuments.documentRow(reference)).toContainText('Safe', {
        timeout: fileUploadTimeouts.virusScanComplete,
      });
    }

    await expect(pages.page.locator('#documents-added tbody tr')).toHaveCount(maximumDocuments);
    await expect(pages.accompanyingDocuments.saveAndAddAnother).toBeVisible();
    await expect(pages.page.locator('.govuk-error-summary')).toHaveCount(0);

    const eleventhReference = `PWCAP${Date.now()}11`;
    await pages.accompanyingDocuments.fillDocument(eleventhReference, issueDate, fileUploadPaths.safeFile1kbPdf);
    await pages.accompanyingDocuments.saveAndAddAnother.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: maximumDocumentsMessage })).toBeVisible();
    await expect(pages.page.locator('.govuk-error-message')).toHaveCount(0);
    await expect(pages.page.locator('#documents-added tbody tr')).toHaveCount(maximumDocuments);
    await expect(pages.accompanyingDocuments.documentRow(eleventhReference)).toHaveCount(0);
  });

  test('accepts a 10 MB PDF and rejects the same real file at one byte over', async ({ journey, pages }, testInfo) => {
    test.slow();
    const exact = await paddedPdf(testInfo.outputPath('boundary-exact.pdf'), TEN_MB_BYTES);
    const over = await paddedPdf(testInfo.outputPath('boundary-over.pdf'), TEN_MB_BYTES + 1);
    await journey.toAccompanyingDocuments();

    const exactReference = `PWEXACT${Date.now()}`;
    await pages.accompanyingDocuments.fillDocument(exactReference, issueDate, exact);
    await pages.accompanyingDocuments.saveAndAddAnother.click();

    await expect(pages.accompanyingDocuments.documentRow(exactReference)).toContainText('Safe', {
      timeout: fileUploadTimeouts.virusScanComplete,
    });
    await expect(pages.page.locator('.govuk-error-summary')).toHaveCount(0);

    const overReference = `PWOVER${Date.now()}`;
    await pages.accompanyingDocuments.fillDocument(overReference, issueDate, over);
    await pages.accompanyingDocuments.saveAndAddAnother.click();

    const oversizeMessage = 'The selected file must be smaller than 10 MB';
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: oversizeMessage })).toBeVisible();
    await expect(pages.page.locator('.govuk-error-message')).toHaveText(`Error: ${oversizeMessage}`);
    await expect(pages.page.locator('#documents-added tbody tr')).toHaveCount(1);
    await expect(pages.accompanyingDocuments.documentRow(overReference)).toHaveCount(0);
  });
});
