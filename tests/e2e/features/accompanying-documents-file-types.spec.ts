import path from 'path';
import { test, expect } from '@fixtures';
import { fileUploadPaths, fileUploadNames } from '@resources/file-upload/paths';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';
import { writeSyntheticFile } from '@utils/synthetic-file-writer';

const safeFileUploadCases = [
  { fileKey: 'safeFile19kbDoc', documentReference: 'REFDOC' },
  { fileKey: 'safeFile10kbDocx', documentReference: 'REFDOCX' },
  { fileKey: 'safeFile25kbXls', documentReference: 'REFXLS' },
  { fileKey: 'safeFile50kbXlsx', documentReference: 'REFXLSX' },
  { fileKey: 'safeFile1kbPdf', documentReference: 'REFPDF' },
  { fileKey: 'safeFile100kbJpg', documentReference: 'REFJPG' },
  { fileKey: 'safeFile500kbJpeg', documentReference: 'REFJPEG' },
] as const satisfies ReadonlyArray<{
  fileKey: keyof typeof fileUploadPaths;
  documentReference: string;
}>;

test.describe('Accompanying documents - supported file types', { tag: '@integration' }, () => {
  for (const { fileKey, documentReference } of safeFileUploadCases) {
    test(`accepts ${fileUploadNames[fileKey]} and completes virus scan`, async ({ pages, journey }) => {
      await journey.toAccompanyingDocuments();

      await pages.accompanyingDocuments.fillTextFields({ documentReference });
      await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fileUploadPaths[fileKey]);
      await pages.accompanyingDocuments.btnAddAttachment.click();

      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.documentsList).toBeVisible({
        timeout: fileUploadTimeouts.documentsListVisible,
      });
      await expect(pages.accompanyingDocuments.getStatusTag(fileUploadNames[fileKey])).toHaveText(/Checking|Safe/);
      await expect(pages.accompanyingDocuments.getStatusTag(fileUploadNames[fileKey])).toHaveText('Safe', {
        timeout: fileUploadTimeouts.virusScanComplete,
      });
    });
  }

  test('accepts a .pdf file when the filename contains multiple dots and completes virus scan', async ({ pages, journey }, testInfo) => {
    await journey.toAccompanyingDocuments();

    const file = await writeSyntheticFile(path.join(testInfo.outputDir, 'file-upload'), 'hello.world.pdf', {
      kb: 1,
    });

    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REFDOTPDF' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(file.filePath);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.documentsList).toBeVisible({
      timeout: fileUploadTimeouts.documentsListVisible,
    });
    await expect(pages.accompanyingDocuments.getStatusTag(file.fileName)).toHaveText(/Checking|Safe/);
    await expect(pages.accompanyingDocuments.getStatusTag(file.fileName)).toHaveText('Safe', {
      timeout: fileUploadTimeouts.virusScanComplete,
    });
  });

  test('accepts a .doc file when the filename contains spaces and allowed special characters', async ({ pages, journey }, testInfo) => {
    await journey.toAccompanyingDocuments();

    const file = await writeSyntheticFile(path.join(testInfo.outputDir, 'file-upload'), 'hello world__test-(v1)+copy.doc', {
      kb: 1,
    });

    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REFDOCSPECIAL' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(file.filePath);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.documentsList).toBeVisible({
      timeout: fileUploadTimeouts.documentsListVisible,
    });
    await expect(pages.accompanyingDocuments.getStatusTag(file.fileName)).toHaveText(/Checking|Safe/);
    await expect(pages.accompanyingDocuments.getStatusTag(file.fileName)).toHaveText('Safe', {
      timeout: fileUploadTimeouts.virusScanComplete,
    });
  });
});

test.describe('Accompanying documents - restricted file types', { tag: '@integration' }, () => {
  test(`rejects ${fileUploadNames.restrictedFile10bTxt} as an unsupported file type`, async ({ pages, journey }) => {
    await journey.toAccompanyingDocuments();

    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REFTXT' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fileUploadPaths.restrictedFile10bTxt);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.documentsList).not.toBeVisible();
    await expect(pages.accompanyingDocuments.errorFile).toContainText('The selected file must be a PDF, DOC, DOCX, JPEG, PNG or XLS');
    const errorSummaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
    expect(errorSummaryItems).toContain('The selected file must be a PDF, DOC, DOCX, JPEG, PNG or XLS');

    await expect(pages.accompanyingDocuments.btnContinueWithoutDocuments).toBeVisible();
    await expect(pages.accompanyingDocuments.btnSaveAndContinue).toHaveCount(0);
  });

  test('rejects a .zip file as an unsupported file type', async ({ pages, journey }, testInfo) => {
    await journey.toAccompanyingDocuments();

    const file = await writeSyntheticFile(path.join(testInfo.outputDir, 'file-upload'), 'restricted-synthetic.zip', {
      kb: 1,
    });

    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REFZIP' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(file.filePath);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.documentsList).not.toBeVisible();
    await expect(pages.accompanyingDocuments.errorFile).toContainText('The selected file must be a PDF, DOC, DOCX, JPEG, PNG or XLS');
    const errorSummaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
    expect(errorSummaryItems).toContain('The selected file must be a PDF, DOC, DOCX, JPEG, PNG or XLS');

    await expect(pages.accompanyingDocuments.btnContinueWithoutDocuments).toBeVisible();
    await expect(pages.accompanyingDocuments.btnSaveAndContinue).toHaveCount(0);
  });
});
