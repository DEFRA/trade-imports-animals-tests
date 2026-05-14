import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@fixtures';
import { writeEicarPdfFile } from '@utils/eicar-file-writer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => path.join(__dirname, '../../../resources/file-upload', name);

test.describe('Accompanying documents', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toAccompanyingDocuments();
  });

  test('shows required form fields', async ({ pages }) => {
    await expect.soft(pages.accompanyingDocuments.headingPage).toHaveText('Accompanying documents');
    await expect.soft(pages.accompanyingDocuments.dropdownDocumentType).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.inputDocumentReference).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.inputIssueDateDay).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.inputIssueDateMonth).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.inputIssueDateYear).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.inputFileUpload).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.btnAddAttachment).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.btnContinue).toBeVisible();
  });

  test('shows expected document type options', async ({ pages }) => {
    const options = pages.page.locator('#documentType option');
    await expect(options).toHaveCount(4);
    await expect(options.nth(0)).toHaveText('Select document type');
    await expect(options.nth(1)).toHaveText('──────────');
    await expect(options.nth(2)).toHaveText('Intra-Trade Animal Health Certificate (ITAHC)');
    await expect(options.nth(2)).toHaveAttribute('value', 'ITAHC');
    await expect(options.nth(3)).toHaveText('Veterinary health certificate');
    await expect(options.nth(3)).toHaveAttribute('value', 'VETERINARY_HEALTH_CERTIFICATE');
  });

  test('Continue without documents is enabled with no documents uploaded', async ({ pages }) => {
    await expect(pages.accompanyingDocuments.btnContinueEnabled).toBeVisible();
    await expect(pages.accompanyingDocuments.btnContinueEnabled).toHaveText('Continue without documents');
  });

  test.describe('Input validation', { tag: '@validation' }, () => {
    test('shows error when invalid document type is submitted', async ({ pages }) => {
      await expect(pages.accompanyingDocuments.dropdownDocumentType).toBeAttached();
      await pages.page.evaluate(() => {
        const select = document.querySelector<HTMLSelectElement>('#documentType');
        if (!select) throw new Error('#documentType not found');
        const opt = document.createElement('option');
        opt.value = 'INVALID';
        opt.text = 'INVALID';
        select.add(opt);
        select.value = 'INVALID';
      });
      await pages.accompanyingDocuments.btnAddAttachment.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.errorDocumentType).toBeVisible();
      const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(summaryItems).toContain('Select a document type');
    });

    test('shows error when document reference contains special characters', async ({ pages }) => {
      await pages.accompanyingDocuments.dropdownDocumentType.selectOption('ITAHC');
      await pages.accompanyingDocuments.inputDocumentReference.fill('REF@#$!');
      await pages.accompanyingDocuments.btnAddAttachment.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.errorDocumentReference).toBeVisible();
      const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(summaryItems).toContain('Document reference must only contain letters and numbers');
    });

    test('shows error when document reference exceeds 100 characters', async ({ pages }) => {
      await pages.accompanyingDocuments.dropdownDocumentType.selectOption('ITAHC');
      // Use evaluate to bypass browser maxlength="100" enforcement and test server-side validation
      await pages.accompanyingDocuments.inputDocumentReference.evaluate((input, value) => {
        (input as HTMLInputElement).value = value;
      }, 'a'.repeat(101));
      await pages.accompanyingDocuments.btnAddAttachment.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.errorDocumentReference).toBeVisible();
      const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(summaryItems).toContain('Document reference must be 100 characters or less');
    });

    test('shows error when no date is provided', async ({ pages }) => {
      await pages.accompanyingDocuments.dropdownDocumentType.selectOption('ITAHC');
      await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fixture('test-document.pdf'));
      await pages.accompanyingDocuments.btnAddAttachment.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.errorIssueDate).toBeVisible();
      const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(summaryItems).toContain('Enter a date of issue');
    });

    test('shows error when partial date is provided', async ({ pages }) => {
      await pages.accompanyingDocuments.dropdownDocumentType.selectOption('ITAHC');
      await pages.accompanyingDocuments.inputIssueDateDay.fill('15');
      await pages.accompanyingDocuments.btnAddAttachment.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.errorIssueDate).toBeVisible();
      const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(summaryItems).toContain('Date of issue must include a month');
    });

    test('shows error when no file is selected', async ({ pages }) => {
      await pages.accompanyingDocuments.fillTextFields();
      await pages.accompanyingDocuments.btnAddAttachment.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.errorFile).toBeVisible();
      const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(summaryItems).toContain('Select a file to upload');
    });
  });

  test('shows document row with Checking status immediately after upload', async ({ pages }) => {
    await pages.accompanyingDocuments.fillTextFields();
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fixture('test-document.pdf'));
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.documentsList).toBeVisible({ timeout: 10000 });

    const statusTag = pages.accompanyingDocuments.getStatusTag('test-document.pdf');
    // Status may already be Safe by the time we assert — accept either
    await expect(statusTag).toBeVisible();
    await expect(statusTag).toHaveText(/Checking|Safe/);
  });

  test('shows Safe status tag once virus scan completes', async ({ pages }) => {
    await pages.accompanyingDocuments.fillTextFields();
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fixture('test-document.pdf'));
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);

    // The page auto-refreshes every 3s while PENDING — wait for COMPLETE state
    const statusTag = pages.accompanyingDocuments.getStatusTag('test-document.pdf');
    await expect(statusTag).toHaveText('Safe', { timeout: 30000 });
    await expect(pages.accompanyingDocuments.btnContinueEnabled).toBeVisible();
  });

  test('shows Virus found status tag and error summary when uploaded file contains a virus', async ({ pages }, testInfo) => {
    // cdp-uploader's mock scanner flags by filename, not content — see resources/file-upload/README.md.
    await pages.accompanyingDocuments.fillTextFields();
    const eicarFile = await writeEicarPdfFile(path.join(testInfo.outputDir, 'file-upload'));
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(eicarFile.filePath);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);

    // The page auto-refreshes every 3s while PENDING — wait for REJECTED state
    const statusTag = pages.accompanyingDocuments.getStatusTag(eicarFile.fileName);
    await expect(statusTag).toHaveText('Virus found', { timeout: 30000 });

    const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
    expect(summaryItems).toEqual(expect.arrayContaining([expect.stringContaining('contains a virus')]));

    await expect(pages.accompanyingDocuments.btnContinueEnabled).not.toBeVisible();
  });

  test('can upload multiple documents and see all in the list', async ({ pages }) => {
    // Upload first document
    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REF001' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fixture('test-document.pdf'));
    await pages.accompanyingDocuments.btnAddAttachment.click();
    await expect(pages.accompanyingDocuments.documentsList).toBeVisible({ timeout: 10000 });

    // Upload second document
    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REF002' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fixture('test-document.pdf'));
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.accompanyingDocuments.documentsList).toBeVisible({ timeout: 10000 });
    await expect(pages.accompanyingDocuments.documentRows).toHaveCount(2);
  });

  test('can remove a document from the list', async ({ pages }) => {
    await pages.accompanyingDocuments.fillTextFields();
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fixture('test-document.pdf'));
    await pages.accompanyingDocuments.btnAddAttachment.click();

    // Wait for the document row to appear (Remove is available immediately)
    await expect(pages.accompanyingDocuments.documentsList).toBeVisible({ timeout: 10000 });

    await pages.accompanyingDocuments.getBtnRemove('test-document.pdf').click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.documentsList).not.toBeVisible();
    await expect(pages.accompanyingDocuments.btnContinueEnabled).toBeVisible();
  });
});
