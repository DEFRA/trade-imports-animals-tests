import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@fixtures';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    await expect.soft(pages.accompanyingDocuments.btnUploadDocument).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.btnSaveAndContinue).toBeVisible();
  });

  test('shows expected document type options', async ({ pages }) => {
    const options = pages.page.locator('#documentType option:not([value=""])');
    await expect(options).toHaveCount(2);
    await expect(options.nth(0)).toHaveText('Intra-Trade Animal Health Certificate (ITAHC)');
    await expect(options.nth(0)).toHaveAttribute('value', 'ITAHC');
    await expect(options.nth(1)).toHaveText('Veterinary health certificate');
    await expect(options.nth(1)).toHaveAttribute('value', 'VETERINARY_HEALTH_CERTIFICATE');
  });

  test('Save and continue is enabled with no documents uploaded', async ({ pages }) => {
    await expect(pages.accompanyingDocuments.btnSaveAndContinueEnabled).toBeVisible();
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
      await pages.accompanyingDocuments.btnUploadDocument.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.errorDocumentType).toBeVisible();
      const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(summaryItems).toContain('Select a document type');
    });

    test('shows error when document reference contains special characters', async ({ pages }) => {
      await pages.accompanyingDocuments.dropdownDocumentType.selectOption('ITAHC');
      await pages.accompanyingDocuments.inputDocumentReference.fill('REF@#$!');
      await pages.accompanyingDocuments.btnUploadDocument.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.errorDocumentReference).toBeVisible();
      const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(summaryItems).toContain('Document reference must only contain letters, numbers, spaces and hyphens');
    });

    test('shows error when document reference exceeds 100 characters', async ({ pages }) => {
      await pages.accompanyingDocuments.dropdownDocumentType.selectOption('ITAHC');
      await pages.accompanyingDocuments.inputDocumentReference.fill('a'.repeat(101));
      await pages.accompanyingDocuments.btnUploadDocument.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.errorDocumentReference).toBeVisible();
      const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(summaryItems).toContain('Document reference must be 100 characters or less');
    });

    test('shows error when no date is provided', async ({ pages }) => {
      await pages.accompanyingDocuments.dropdownDocumentType.selectOption('ITAHC');
      await pages.accompanyingDocuments.btnUploadDocument.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.errorIssueDate).toBeVisible();
      const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(summaryItems).toContain('Enter a date of issue');
    });

    test('shows error when partial date is provided', async ({ pages }) => {
      await pages.accompanyingDocuments.dropdownDocumentType.selectOption('ITAHC');
      await pages.accompanyingDocuments.inputIssueDateDay.fill('15');
      await pages.accompanyingDocuments.btnUploadDocument.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.errorIssueDate).toBeVisible();
      const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(summaryItems).toContain('Date of issue must include a month');
    });

    test('shows error when no file is selected', async ({ pages }) => {
      await pages.accompanyingDocuments.fillTextFields();
      await pages.accompanyingDocuments.btnUploadDocument.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.errorFile).toBeVisible();
      const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(summaryItems).toContain('Select a file to upload');
    });
  });

  test('shows document row with Checking status immediately after upload', async ({ pages }) => {
    await pages.accompanyingDocuments.fillTextFields();
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(path.join(__dirname, '../../fixtures/test-document.pdf'));
    await pages.accompanyingDocuments.btnUploadDocument.click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.documentsTable).toBeVisible({ timeout: 10000 });

    const statusTag = pages.accompanyingDocuments.getStatusTag('test-document.pdf');
    // Status may already be Safe by the time we assert — accept either
    await expect(statusTag).toBeVisible();
    await expect(statusTag).toHaveText(/Checking|Safe/);
  });

  test('shows Safe status tag once virus scan completes', async ({ pages }) => {
    await pages.accompanyingDocuments.fillTextFields();
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(path.join(__dirname, '../../fixtures/test-document.pdf'));
    await pages.accompanyingDocuments.btnUploadDocument.click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);

    // The page auto-refreshes every 3s while PENDING — wait for COMPLETE state
    const statusTag = pages.accompanyingDocuments.getStatusTag('test-document.pdf');
    await expect(statusTag).toHaveText('Safe', { timeout: 30000 });
    await expect(pages.accompanyingDocuments.btnSaveAndContinueEnabled).toBeVisible();
  });

  test('shows Virus found status tag and error summary when uploaded file contains a virus', async ({ pages }) => {
    // Note: cdp-uploader's mock virus scanner (MOCK_VIRUS_SCAN_ENABLED=true) detects "viruses" by
    // matching the filename against the regex .*virus.* (MOCK_VIRUS_REGEX). File content is never
    // inspected — the fixture content being identical to test-document.pdf is intentional; only the
    // filename matters for triggering the INFECTED scan result in the test environment.
    await pages.accompanyingDocuments.fillTextFields();
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(path.join(__dirname, '../../fixtures/test-virus-document.pdf'));
    await pages.accompanyingDocuments.btnUploadDocument.click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);

    // The page auto-refreshes every 3s while PENDING — wait for REJECTED state
    const statusTag = pages.accompanyingDocuments.getStatusTag('test-virus-document.pdf');
    await expect(statusTag).toHaveText('Virus found', { timeout: 30000 });

    const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
    expect(summaryItems).toEqual(expect.arrayContaining([expect.stringContaining('contains a virus')]));

    await expect(pages.accompanyingDocuments.btnSaveAndContinueEnabled).not.toBeVisible();
  });

  test('can upload multiple documents and see all in the list', async ({ pages }) => {
    // Upload first document
    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REF-001' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(path.join(__dirname, '../../fixtures/test-document.pdf'));
    await pages.accompanyingDocuments.btnUploadDocument.click();
    await expect(pages.accompanyingDocuments.documentsTable).toBeVisible({ timeout: 10000 });

    // Upload second document
    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REF-002' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(path.join(__dirname, '../../fixtures/test-document.pdf'));
    await pages.accompanyingDocuments.btnUploadDocument.click();

    await expect(pages.accompanyingDocuments.documentsTable).toBeVisible({ timeout: 10000 });
    await expect(pages.accompanyingDocuments.documentRows).toHaveCount(2);
  });

  test('can remove a document from the list', async ({ pages }) => {
    await pages.accompanyingDocuments.fillTextFields();
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(path.join(__dirname, '../../fixtures/test-document.pdf'));
    await pages.accompanyingDocuments.btnUploadDocument.click();

    // Wait for the document row to appear (Remove is available immediately)
    await expect(pages.accompanyingDocuments.documentsTable).toBeVisible({ timeout: 10000 });

    await pages.accompanyingDocuments.getBtnRemove('test-document.pdf').click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.documentsTable).not.toBeVisible();
    await expect(pages.accompanyingDocuments.btnSaveAndContinueEnabled).toBeVisible();
  });
});
