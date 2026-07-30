import path from 'path';
import { test, expect } from '@main-fixtures';
import type { PageObjects } from '@main-page-objects';
import { writeEicarPdfFile } from '@main-utils/eicar-file-writer';
import { yesNoValues } from '@main-domain/constants/yes-no-values';
import { documentTypes } from '@main-domain/constants/document-types';
import { fileUploadPaths, fileUploadNames } from '@main-resources/file-upload/paths';
import { camelCaseToSentenceCase } from '@main-utils/string-utils';
import { fileUploadTimeouts } from '@main-config/file-upload-timeouts';

async function fillValidAddAttachmentForm(pages: PageObjects): Promise<void> {
  await pages.accompanyingDocuments.fillTextFields();
  await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fileUploadPaths.safeFile250bPng);
}

test.describe('Accompanying documents', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('accompanyingDocuments');
    await apiJourney.resumeInUi(created.referenceNumber, pages.accompanyingDocuments);
  });

  test('shows system-generated reference number', async ({ journeyContext, pages }) => {
    const referenceNumber = await pages.accompanyingDocuments.referenceNumber.textContent();
    expect(referenceNumber).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.referenceNumber).toBe(referenceNumber);
  });

  test('can navigate back to additional details', async ({ pages }) => {
    await pages.accompanyingDocuments.linkBack.click();
    await expect(pages.page).toHaveURL(pages.additionalDetails.expectedUrl);
    await expect(pages.additionalDetails.heading).toBeVisible();

    await test.step('previously entered additional details are retained', async () => {
      await expect(pages.additionalDetails.radioApprovedBodies).toBeChecked();
      await expect(pages.additionalDetails.radioContainsUnweanedAnimals(yesNoValues.no)).toBeChecked();
    });
  });

  test('shows required form fields', async ({ pages }) => {
    await expect(pages.accompanyingDocuments.heading).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.dropdownDocumentType).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.inputDocumentReference).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.inputIssueDateDay).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.inputIssueDateMonth).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.inputIssueDateYear).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.inputFileUpload).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.btnAddAttachment).toBeVisible();
    await expect.soft(pages.accompanyingDocuments.btnContinueWithoutDocuments).toBeVisible();
    // Save and continue is not shown until a safe document is uploaded.
    await expect.soft(pages.accompanyingDocuments.btnSaveAndContinue).toHaveCount(0);
  });

  test('shows expected document type options', async ({ pages }) => {
    const options = pages.accompanyingDocuments.dropdownDocumentType.locator('option');
    const keys = Object.keys(documentTypes) as (keyof typeof documentTypes)[];
    const documentTypeLabelOverrides: Partial<Record<keyof typeof documentTypes, string>> = {
      itahc: 'Intra-Trade Animal Health Certificate (ITAHC)',
    };
    const expectedDocumentTypes = keys.map((key) => ({
      value: documentTypes[key],
      label: documentTypeLabelOverrides[key] ?? camelCaseToSentenceCase(key),
    }));

    await expect(options).toHaveCount(2 + expectedDocumentTypes.length);
    await expect(options.nth(0)).toHaveText('Select document type');
    await expect(options.nth(1)).toHaveText(/^─+$/);

    for (const [index, { value, label }] of expectedDocumentTypes.entries()) {
      const option = options.nth(index + 2);
      await expect(option).toHaveText(label);
      await expect(option).toHaveAttribute('value', value);
    }
  });

  test('shows document row with checking/safe status immediately after upload', async ({ pages }) => {
    await pages.accompanyingDocuments.fillTextFields();
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fileUploadPaths.safeFile250bPng);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.documentsList).toBeVisible({ timeout: fileUploadTimeouts.documentsListVisible });

    const statusTag = pages.accompanyingDocuments.getStatusTag(fileUploadNames.safeFile250bPng);
    // Scan may still be in progress, or already complete — accept either status.
    await expect(statusTag).toBeVisible();
    await expect(statusTag).toHaveText(/Checking|Safe/);
  });

  test('shows safe status and enables save and continue once scan completes', async ({ pages }) => {
    await pages.accompanyingDocuments.fillTextFields();
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fileUploadPaths.safeFile250bPng);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.btnSaveAndContinue).toBeDisabled(); // Race condition?
    await expect(pages.accompanyingDocuments.btnContinueWithoutDocuments).toHaveCount(0);
    const statusTag = pages.accompanyingDocuments.getStatusTag(fileUploadNames.safeFile250bPng);
    // Page polls every 3s while the scan is pending; timeout waits for Safe.
    await expect(statusTag).toHaveText('Safe', { timeout: fileUploadTimeouts.virusScanComplete });
    await expect(pages.accompanyingDocuments.btnSaveAndContinue).toBeEnabled();
    await expect(pages.accompanyingDocuments.btnContinueWithoutDocuments).toHaveCount(0);
  });

  test('shows virus found status, error summary, and disabled continue button when file is infected', async ({ pages }, testInfo) => {
    await pages.accompanyingDocuments.fillTextFields();
    const eicarFile = await writeEicarPdfFile(path.join(testInfo.outputDir, 'file-upload'));
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(eicarFile.filePath);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.btnSaveAndContinue).toBeDisabled(); // Race condition?
    await expect(pages.accompanyingDocuments.btnContinueWithoutDocuments).toHaveCount(0);
    const statusTag = pages.accompanyingDocuments.getStatusTag(eicarFile.fileName);
    // Page polls every 3s while the scan is pending; timeout waits for Virus found.
    await expect(statusTag).toHaveText('Virus found', { timeout: fileUploadTimeouts.virusScanComplete });
    await expect(pages.accompanyingDocuments.btnSaveAndContinue).toBeDisabled();
    await expect(pages.accompanyingDocuments.btnContinueWithoutDocuments).toHaveCount(0);
    const summaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
    expect(summaryItems).toContain(`${eicarFile.fileName} contains a virus. Remove it and try again with a different file.`);
  });

  test('can upload multiple documents and see all in the list', async ({ pages }) => {
    const uploadCount = 10;

    for (let i = 1; i <= uploadCount; i++) {
      const documentReference = `REF0${String(i).padStart(2, '0')}`;
      await test.step(`upload document ${documentReference}`, async () => {
        await pages.accompanyingDocuments.fillTextFields({ documentReference });
        await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fileUploadPaths.safeFile250bPng);
        await pages.accompanyingDocuments.btnAddAttachment.click();
        await expect(pages.accompanyingDocuments.documentsList).toBeVisible({ timeout: fileUploadTimeouts.documentsListVisible });
      });
    }

    await test.step('documents list shows all uploads', async () => {
      await expect(pages.accompanyingDocuments.documentRows).toHaveCount(uploadCount);
      await expect(pages.accompanyingDocuments.btnSaveAndContinue).toBeEnabled({
        timeout: fileUploadTimeouts.virusScanComplete,
      });
    });

    await test.step('cannot upload more documents', async () => {
      await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REF011' });
      await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fileUploadPaths.safeFile250bPng);
      await pages.accompanyingDocuments.btnAddAttachment.click();
      // The over-cap response re-renders the same URL, so allTextContents
      // alone doesn't auto-wait — anchor the assertion to a Locator first.
      await expect(pages.accompanyingDocuments.errorSummaryItems).toHaveCount(1);
      await expect(pages.accompanyingDocuments.errorSummaryItems.first()).toHaveText('You can add a maximum of 10 documents');
    });
  });

  test('can remove a document from the list and restore continue without documents button', async ({ pages }) => {
    await pages.accompanyingDocuments.fillTextFields();
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(fileUploadPaths.safeFile250bPng);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.accompanyingDocuments.documentsList).toBeVisible({ timeout: fileUploadTimeouts.documentsListVisible });
    await pages.accompanyingDocuments.getBtnRemove(fileUploadNames.safeFile250bPng).click();

    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.documentsList).not.toBeVisible();
    await expect(pages.accompanyingDocuments.btnContinueWithoutDocuments).toBeVisible();
  });

  test('continues to addresses without documents', async ({ pages }) => {
    await pages.accompanyingDocuments.btnContinueWithoutDocuments.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
  });

  test('continues to addresses after saving with documents', async ({ pages }) => {
    await fillValidAddAttachmentForm(pages);
    await pages.accompanyingDocuments.btnAddAttachment.click();
    await expect(pages.accompanyingDocuments.btnSaveAndContinue).toBeEnabled({ timeout: fileUploadTimeouts.virusScanComplete });
    await pages.accompanyingDocuments.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
  });

  test.describe('Input validation', { tag: '@validation' }, () => {
    test('shows error when invalid document type is submitted', async ({ pages }) => {
      await fillValidAddAttachmentForm(pages);
      // Set an invalid document type via the DOM; the dropdown has no such option.
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
      const errorInline = pages.accompanyingDocuments.errorDocumentType;
      await expect(errorInline).toContainText('Select a document type');
      const errorSummaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(1);
      expect(errorSummaryItems).toContain('Select a document type');
    });

    test('shows error when document reference contains special characters', async ({ pages }) => {
      await fillValidAddAttachmentForm(pages);
      await pages.accompanyingDocuments.inputDocumentReference.fill('REF@#$!');
      await pages.accompanyingDocuments.btnAddAttachment.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      const errorInline = pages.accompanyingDocuments.errorDocumentReference;
      await expect(errorInline).toContainText('Document reference must only contain letters and numbers');
      const errorSummaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(1);
      expect(errorSummaryItems).toContain('Document reference must only contain letters and numbers');
    });

    test('shows error when document reference exceeds 100 characters', async ({ pages }) => {
      await fillValidAddAttachmentForm(pages);
      // Set a 101-character reference via the DOM; maxlength="100" blocks normal input.
      await pages.accompanyingDocuments.inputDocumentReference.evaluate((input, value) => {
        (input as HTMLInputElement).value = value;
      }, 'a'.repeat(101));
      await pages.accompanyingDocuments.btnAddAttachment.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      const errorInline = pages.accompanyingDocuments.errorDocumentReference;
      await expect(errorInline).toContainText('Document reference must be 100 characters or less');
      const errorSummaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(1);
      expect(errorSummaryItems).toContain('Document reference must be 100 characters or less');
    });

    test('shows error when no date is provided', async ({ pages }) => {
      await fillValidAddAttachmentForm(pages);
      await pages.accompanyingDocuments.inputIssueDateDay.fill('');
      await pages.accompanyingDocuments.inputIssueDateMonth.fill('');
      await pages.accompanyingDocuments.inputIssueDateYear.fill('');
      await pages.accompanyingDocuments.btnAddAttachment.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      const errorInline = pages.accompanyingDocuments.errorIssueDate;
      await expect(errorInline).toContainText('Enter a date of issue');
      const errorSummaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(1);
      expect(errorSummaryItems).toContain('Enter a date of issue');
    });

    test('shows error when partial date is provided', async ({ pages }) => {
      await fillValidAddAttachmentForm(pages);
      await pages.accompanyingDocuments.inputIssueDateDay.fill('15');
      await pages.accompanyingDocuments.inputIssueDateMonth.fill('');
      await pages.accompanyingDocuments.inputIssueDateYear.fill('2026');
      await pages.accompanyingDocuments.btnAddAttachment.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      const errorInline = pages.accompanyingDocuments.errorIssueDate;
      await expect(errorInline).toContainText('Date of issue must include a month');
      const errorSummaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(1);
      expect(errorSummaryItems).toContain('Date of issue must include a month');
    });

    test('shows error when no file is selected', async ({ pages }) => {
      await pages.accompanyingDocuments.fillTextFields();
      await pages.accompanyingDocuments.btnAddAttachment.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      const errorInline = pages.accompanyingDocuments.errorFile;
      await expect(errorInline).toContainText('Select a file to upload');
      const errorSummaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(1);
      expect(errorSummaryItems).toContain('Select a file to upload');
    });

    test('shows multiple errors when required fields are missing or invalid', async ({ pages }) => {
      await pages.accompanyingDocuments.inputDocumentReference.fill('REF@#$!');
      await pages.accompanyingDocuments.btnAddAttachment.click();
      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.errorDocumentType).toContainText('Select a document type');
      await expect(pages.accompanyingDocuments.errorDocumentReference).toContainText(
        'Document reference must only contain letters and numbers',
      );
      await expect(pages.accompanyingDocuments.errorFile).toContainText('Select a file to upload');
      await expect(pages.accompanyingDocuments.errorSummaryItems).toHaveCount(3);
      await expect(pages.accompanyingDocuments.errorSummaryItems.filter({ hasText: 'Select a document type' })).toHaveCount(1);
      await expect(
        pages.accompanyingDocuments.errorSummaryItems.filter({ hasText: 'Document reference must only contain letters and numbers' }),
      ).toHaveCount(1);
      await expect(pages.accompanyingDocuments.errorSummaryItems.filter({ hasText: 'Select a file to upload' })).toHaveCount(1);
    });
  });
});
