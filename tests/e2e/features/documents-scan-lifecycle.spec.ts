import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@fixtures';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

const issueDate = { day: '3', month: '1', year: '2026' } as const;

test.describe('Documents scan lifecycle', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toAccompanyingDocuments();
  });

  test('virus-named upload: accepted with Checking, then Virus found with error summary and no view link', async ({ pages }, testInfo) => {
    test.slow();
    const virusFilePath = testInfo.outputPath('virus-test.pdf');
    await mkdir(path.dirname(virusFilePath), { recursive: true });
    await copyFile(fileUploadPaths.safeFile1kbPdf, virusFilePath);

    const reference = `PWVIRUS${Date.now()}`;
    await pages.accompanyingDocuments.fillDocument(reference, issueDate, virusFilePath);
    await pages.accompanyingDocuments.saveAndAddAnother.click();

    const row = pages.accompanyingDocuments.documentRow(reference);
    await expect(row).toBeVisible();
    await expect(row).toContainText('Checking');

    await expect(row).toContainText('Virus found', { timeout: fileUploadTimeouts.virusScanComplete });
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(
      pages.page.getByText('virus-test.pdf contains a virus. Remove it and try again with a different file.').first(),
    ).toBeVisible();
    await expect(pages.accompanyingDocuments.viewFile(1)).toHaveCount(0);
  });

  test('clean upload: shows Checking with no view link, then Safe with a view link', async ({ pages }) => {
    test.slow();
    const reference = `PWSCAN${Date.now()}`;
    await pages.accompanyingDocuments.fillDocument(reference, issueDate, fileUploadPaths.safeFile1kbPdf);
    await pages.accompanyingDocuments.saveAndAddAnother.click();

    const row = pages.accompanyingDocuments.documentRow(reference);
    await expect(row).toBeVisible();
    await expect(row).toContainText('Checking');
    await expect(pages.accompanyingDocuments.viewFile(1)).toHaveCount(0);
    await expect(pages.accompanyingDocuments.removeDocument(1)).toBeVisible();

    await expect(row).toContainText('Safe', { timeout: fileUploadTimeouts.virusScanComplete });
    await expect(pages.accompanyingDocuments.viewFile(1)).toBeVisible();
  });
});
