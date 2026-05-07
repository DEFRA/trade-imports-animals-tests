import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@fixtures';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('removed document does not return after backend refresh', { tag: ['@integration'] }, async ({ pages, journeys }) => {
  await journeys.toAccompanyingDocuments();

  // Upload first document
  await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REF001' });
  await pages.accompanyingDocuments.inputFileUpload.setInputFiles(path.join(__dirname, '../../../resources/file-upload/test-document.pdf'));
  await pages.accompanyingDocuments.btnAddAttachment.click();
  await expect(pages.accompanyingDocuments.documentsList).toBeVisible({ timeout: 10000 });

  // Upload second document
  await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REF002' });
  await pages.accompanyingDocuments.inputFileUpload.setInputFiles(path.join(__dirname, '../../../resources/file-upload/test-document.pdf'));
  await pages.accompanyingDocuments.btnAddAttachment.click();
  await expect(pages.accompanyingDocuments.documentsList).toBeVisible({ timeout: 10000 });

  await expect(pages.accompanyingDocuments.documentRows).toHaveCount(2);

  // Wait for all scans to complete
  await expect(pages.accompanyingDocuments.btnContinueEnabled).toBeVisible({ timeout: 30000 });

  // Remove the first document
  await pages.accompanyingDocuments.getBtnRemove('test-document.pdf').first().click(); // two docs share this filename
  await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
  await expect(pages.accompanyingDocuments.documentRows).toHaveCount(1);

  // Reload the page to re-fetch state from the backend — proves the removal persisted
  await pages.page.reload();
  await expect(pages.accompanyingDocuments.documentRows).toHaveCount(1);
  await expect(pages.accompanyingDocuments.documentRows.first()).toContainText('REF002');

  // The surviving document should be downloadable
  const [download] = await Promise.all([
    pages.page.waitForEvent('download'),
    pages.accompanyingDocuments.getViewFileLink('test-document.pdf').click(),
  ]);
  expect(download.suggestedFilename()).toBe('test-document.pdf');
});
