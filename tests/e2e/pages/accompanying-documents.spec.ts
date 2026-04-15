import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@fixtures';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe('Accompanying documents', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toAccompanyingDocuments();
  });

  test('shows required form fields', async ({ pages }) => {
    await expect.soft(pages.accompanyingDocuments.headingPage).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.dropdownDocumentType).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.inputDocumentReference).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.inputIssueDateDay).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.inputIssueDateMonth).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.inputIssueDateYear).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.inputFileUpload).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.btnSaveAndContinue).toBeVisible();
  });

  test('can skip and continue without adding a document', async ({ pages }) => {
    await pages.accompanyingDocuments.btnSaveAndContinue.click();
    await expect(pages.page).not.toHaveURL(pages.accompanyingDocuments.expectedUrl);
  });

  test.describe('Input validation', { tag: '@validation' }, () => {
    test('shows error when invalid document type is submitted', async ({ pages }) => {
      // Force-select an invalid option by manipulating the select value directly
      await pages.page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const select = document.querySelector('#documentType') as HTMLSelectElement;
        const opt = document.createElement('option');
        opt.value = 'INVALID';
        opt.text = 'INVALID';
        select.add(opt);
        select.value = 'INVALID';
      });
      await pages.accompanyingDocuments.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.errorDocumentType).toBeVisible();
      const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(summaryItems).toContain('Select a document type');
    });

    test('shows error when document reference contains special characters', async ({ pages }) => {
      await pages.accompanyingDocuments.dropdownDocumentType.selectOption('ITAHC');
      await pages.accompanyingDocuments.inputDocumentReference.fill('REF@#$!');
      await pages.accompanyingDocuments.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.errorDocumentReference).toBeVisible();
      const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(summaryItems).toContain('Document reference must only contain letters, numbers, spaces and hyphens');
    });

    test('shows error when partial date is provided', async ({ pages }) => {
      await pages.accompanyingDocuments.dropdownDocumentType.selectOption('ITAHC');
      await pages.accompanyingDocuments.inputIssueDateDay.fill('15');
      await pages.accompanyingDocuments.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.errorIssueDate).toBeVisible();
      const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(summaryItems).toContain('Enter a complete date of issue');
    });

    test('shows error when no file is selected', async ({ pages }) => {
      await pages.accompanyingDocuments.fillTextFields();
      await pages.accompanyingDocuments.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.errorFile).toBeVisible();
      const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(summaryItems).toContain('Select a file to upload');
    });
  });

  test('can upload a file and reach upload-received page', async ({ pages }) => {
    await pages.accompanyingDocuments.fillTextFields();
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(path.join(__dirname, '../../fixtures/test-document.txt'));
    await pages.accompanyingDocuments.btnSaveAndContinue.click();
    await pages.page.waitForURL(`**${pages.accompanyingDocuments.expectedUploadReceivedUrl}`, {
      timeout: 15000,
    });
    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUploadReceivedUrl);
  });

  test('shows success panel once virus scan completes', async ({ pages }) => {
    await pages.accompanyingDocuments.fillTextFields();
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(path.join(__dirname, '../../fixtures/test-document.pdf'));
    await pages.accompanyingDocuments.btnSaveAndContinue.click();
    await pages.page.waitForURL(`**${pages.uploadReceived.expectedUrl}`, { timeout: 15000 });

    // The page auto-refreshes every 3s while PENDING — wait for COMPLETE state
    await expect(pages.uploadReceived.panelSuccess).toBeVisible({ timeout: 30000 });
    await expect(pages.uploadReceived.btnContinue).toBeVisible();
  });

  test('shows virus error when uploaded file contains a virus', async ({ pages }) => {
    await pages.accompanyingDocuments.fillTextFields();
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(path.join(__dirname, '../../fixtures/test-virus-document.pdf'));
    await pages.accompanyingDocuments.btnSaveAndContinue.click();
    await pages.page.waitForURL(`**${pages.uploadReceived.expectedUrl}`, { timeout: 15000 });

    // The page auto-refreshes every 3s while PENDING — wait for REJECTED state
    await expect(pages.uploadReceived.errorVirusSummary).toBeVisible({ timeout: 30000 });
    await expect(pages.uploadReceived.errorVirusSummary.getByText('The selected file contains a virus')).toBeVisible();
    await expect(pages.uploadReceived.btnTryAgain).toBeVisible();
  });
});
