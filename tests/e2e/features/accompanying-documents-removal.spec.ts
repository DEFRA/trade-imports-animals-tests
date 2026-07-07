import { test, expect } from '@fixtures';
import { fileUploadPaths, fileUploadNames } from '@resources/file-upload/paths';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

test('removed document does not return after backend refresh', { tag: ['@integration'] }, async ({ pages, journey }) => {
  await journey.toAccompanyingDocuments();

  await test.step('upload two documents', async () => {
    const uploadCount = 2;

    for (let i = 1; i <= uploadCount; i++) {
      const documentReference = `REF0${String(i).padStart(2, '0')}`;
      await test.step(`upload document ${documentReference}`, async () => {
        await pages.accompanyingDocuments.fillTextFields({ documentReference });
        await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fileUploadPaths.safeFile250bPng);
        await pages.accompanyingDocuments.btnAddAttachment.click();
        await expect(pages.accompanyingDocuments.documentsList).toBeVisible({ timeout: fileUploadTimeouts.documentsListVisible });
      });
    }

    await expect(pages.accompanyingDocuments.documentRows).toHaveCount(uploadCount);
  });

  await test.step('wait for all scans to complete', async () => {
    await expect(pages.accompanyingDocuments.btnSaveAndContinue).toBeEnabled({ timeout: fileUploadTimeouts.virusScanComplete });
  });

  await test.step('remove the first document', async () => {
    // two docs share this filename
    await pages.accompanyingDocuments.getBtnRemove(fileUploadNames.safeFile250bPng).first().click();
    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.documentRows).toHaveCount(1);
  });

  await test.step('reload the page to re-fetch state from the backend', async () => {
    await pages.page.reload();
    await expect(pages.accompanyingDocuments.documentRows).toHaveCount(1);
    await expect(pages.accompanyingDocuments.documentRows.first()).toContainText('REF002');
  });

  await test.step('surviving document is downloadable', async () => {
    const [download] = await Promise.all([
      pages.page.waitForEvent('download'),
      pages.accompanyingDocuments.getViewFileLink(fileUploadNames.safeFile250bPng).click(),
    ]);
    expect(download.suggestedFilename()).toBe(fileUploadNames.safeFile250bPng);
  });
});
