import path from 'path';
import { test, expect } from '@fixtures';
import { skipIfCdpEnvironment, skipIfComposeEnvironment } from '@utils/playwright/environment';
import { writeSyntheticFile } from '@utils/synthetic-file-writer';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

/** CDP infra cap (observed on dev): largest accept / smallest reject. */
const CDP_MAX_ACCEPTED_BYTES = 10_484_904;
const CDP_MIN_REJECTED_BYTES = 10_484_905;

/** Mock uploader limit is 50 MiB (50 × 1024² bytes), not decimal MB — express via `{ bytes }`. */
const FIFTY_MIB_BYTES = 50 * 1024 * 1024;

test.describe('Accompanying documents - file size limit', { tag: '@integration' }, () => {
  test.describe('CDP uploader — ~10 MiB infra cap', () => {
    // Note: Form fields add bytes to the multipart upload payload — keep the file slightly under the infra cap.
    test('accepts a file at 10,484,904 bytes and completes virus scan', { tag: '@slow' }, async ({ pages, journeys }, testInfo) => {
      skipIfComposeEnvironment('CDP only: real uploader limits and over-limit behaviour differ from mock uploader.');
      await journeys.toAccompanyingDocuments();

      const file = await writeSyntheticFile(path.join(testInfo.outputDir, 'file-upload'), 'cdp-infra.pdf', {
        bytes: CDP_MAX_ACCEPTED_BYTES,
      });

      await pages.accompanyingDocuments.fillTextFields({ documentReference: 'CDPINFRA01' });
      await pages.accompanyingDocuments.inputFileUpload.setInputFiles(file.filePath);
      await pages.accompanyingDocuments.btnAddAttachment.click();

      await expect(pages.accompanyingDocuments.documentsList).toBeVisible({
        timeout: fileUploadTimeouts.documentsListVisible,
      });
      await expect(pages.accompanyingDocuments.getStatusTag(file.fileName)).toHaveText(/Checking|Safe/);
      await expect(pages.accompanyingDocuments.getStatusTag(file.fileName)).toHaveText('Safe', {
        timeout: fileUploadTimeouts.virusScanComplete,
      });
    });

    test('shows an error when file is 10,484,905 bytes (1 byte over cdp limit)', async ({ pages, journeys }, testInfo) => {
      skipIfComposeEnvironment('CDP only: real uploader limits and over-limit behaviour differ from mock uploader.');
      await journeys.toAccompanyingDocuments();

      const file = await writeSyntheticFile(path.join(testInfo.outputDir, 'file-upload'), 'cdp-infra.pdf', {
        bytes: CDP_MIN_REJECTED_BYTES,
      });

      await pages.accompanyingDocuments.fillTextFields({ documentReference: 'CDPINFRA01' });
      await pages.accompanyingDocuments.inputFileUpload.setInputFiles(file.filePath);
      await pages.accompanyingDocuments.btnAddAttachment.click();

      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.documentsList).not.toBeVisible();
      await expect(pages.page).toHaveTitle('413 Request Entity Too Large');
    });
  });

  test.describe('Mock uploader - 50 MiB binary limit', { tag: ['@compose', '@integration'] }, () => {
    test('accepts a file at exactly 50 mib and completes virus scan', { tag: '@slow' }, async ({ pages, journeys }, testInfo) => {
      skipIfCdpEnvironment('Compose/local only: mock uploader limits and over-limit behaviour differ from CDP uploader.');
      await journeys.toAccompanyingDocuments();

      const file = await writeSyntheticFile(path.join(testInfo.outputDir, 'file-upload'), 'mock-50mib-at-limit.pdf', {
        bytes: FIFTY_MIB_BYTES,
      });

      await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REF50MIB' });
      await pages.accompanyingDocuments.inputFileUpload.setInputFiles(file.filePath);
      await pages.accompanyingDocuments.btnAddAttachment.click();

      await expect(pages.accompanyingDocuments.documentsList).toBeVisible({
        timeout: fileUploadTimeouts.documentsListVisible,
      });
      await expect(pages.accompanyingDocuments.getStatusTag(file.fileName)).toHaveText(/Checking|Safe/);
      await expect(pages.accompanyingDocuments.getStatusTag(file.fileName)).toHaveText('Safe', {
        timeout: fileUploadTimeouts.virusScanComplete * 2,
      });
    });

    test('shows an error when file is 1 byte over the 50 mib upload limit', async ({ pages, journeys }, testInfo) => {
      skipIfCdpEnvironment('Compose/local only: mock uploader limits and over-limit behaviour differ from CDP uploader.');
      await journeys.toAccompanyingDocuments();

      const file = await writeSyntheticFile(path.join(testInfo.outputDir, 'file-upload'), 'mock-50mib-one-byte-over.pdf', {
        bytes: FIFTY_MIB_BYTES + 1,
      });

      await pages.accompanyingDocuments.fillTextFields({ documentReference: 'REFOVER50MIB' });
      await pages.accompanyingDocuments.inputFileUpload.setInputFiles(file.filePath);
      await pages.accompanyingDocuments.btnAddAttachment.click();

      await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
      await expect(pages.accompanyingDocuments.documentsList).not.toBeVisible();
      const errorSummaryItems = await pages.accompanyingDocuments.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toContain('The file could not be uploaded. Try again.');

      await expect(pages.accompanyingDocuments.btnContinueWithoutDocuments).toBeVisible();
      await expect(pages.accompanyingDocuments.btnSaveAndContinue).toHaveCount(0);
    });
  });
});
