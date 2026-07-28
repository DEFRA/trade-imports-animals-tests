import path from 'path';
import { test, expect } from '@fixtures';
import { createPageObjects } from '@page-objects';
import { FIFTY_MB_BYTES } from '@resources/file-upload/constants';
import { writeSyntheticFile } from '@utils/synthetic-file-writer';
import { fileUploadTimeouts } from '@config/file-upload-timeouts';

test.describe('Accompanying documents - large uploads', { tag: '@integration' }, () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('accompanyingDocuments');
    await apiJourney.resumeInUi(created.referenceNumber, pages.accompanyingDocuments);
  });

  // AC5 target: proves the new browser → /upload-and-scan → cdp-uploader flow supports 50 MB.
  // Red under baseline (nginx sidecar rejects at 10 M cap); green once the form action moves
  // to /upload-and-scan/<uploadId>.
  test('uploads a 50 MB file successfully via the /upload-and-scan flow', { tag: '@slow' }, async ({ pages }, testInfo) => {
    test.slow();

    const file = await writeSyntheticFile(path.join(testInfo.outputDir, 'file-upload'), 'target-50mb.pdf', {
      bytes: FIFTY_MB_BYTES,
    });

    await pages.accompanyingDocuments.fillTextFields({ documentReference: 'TARGET50MB01' });
    await pages.accompanyingDocuments.inputFileUpload.setInputFiles(file.filePath);
    await pages.accompanyingDocuments.btnAddAttachment.click();

    await expect(pages.accompanyingDocuments.documentsList).toBeVisible({
      timeout: fileUploadTimeouts.documentsListVisible,
    });
    await expect(pages.accompanyingDocuments.getStatusTag(file.fileName)).toHaveText('Safe', {
      timeout: fileUploadTimeouts.virusScanComplete * 2,
    });
  });

  // Verifies the correlationId-scoped wait page — two browser tabs on the same notification,
  // each uploading its own file, must not redirect prematurely on the other tab's callback.
  // Each tab's /initiate mints its own correlationId and threads it through the redirect URL;
  // the wait page filters the backend docs list to that correlationId so Tab 2's callback
  // landing doesn't cause Tab 1 to redirect (or vice versa).
  test(
    'two tabs on the same notification each end up showing their own upload as Safe',
    { tag: '@slow' },
    async ({ pages, page }, testInfo) => {
      test.slow();

      // Same browser context — the two tabs share the auth cookie set up by the beforeEach.
      const tab1 = page;
      const tab2 = await page.context().newPage();
      const tab2Objects = createPageObjects(tab2);

      // Tab 2 needs to land on the same accompanying-documents page as Tab 1. It inherits the
      // auth from the shared context, so a direct navigation is enough — no fresh apiJourney
      // needed because the notification session state is server-side.
      await tab2.goto(tab1.url());
      await expect(tab2Objects.accompanyingDocuments.heading).toBeVisible();

      const file1 = await writeSyntheticFile(path.join(testInfo.outputDir, 'file-upload'), 'tab1-target-50mb.pdf', {
        bytes: FIFTY_MB_BYTES,
      });
      const file2 = await writeSyntheticFile(path.join(testInfo.outputDir, 'file-upload'), 'tab2-target-50mb.pdf', {
        bytes: FIFTY_MB_BYTES,
      });

      // Two tabs each fill + submit their form. Kicked off in parallel so Tab 2's callback
      // has a genuine chance of landing while Tab 1 is on its wait page (and vice versa) —
      // this is the multi-tab race the correlationId filter defends against.
      await Promise.all([
        (async () => {
          await pages.accompanyingDocuments.fillTextFields({ documentReference: 'TAB1REF001' });
          await pages.accompanyingDocuments.inputFileUpload.setInputFiles(file1.filePath);
          await pages.accompanyingDocuments.btnAddAttachment.click();
        })(),
        (async () => {
          await tab2Objects.accompanyingDocuments.fillTextFields({ documentReference: 'TAB2REF002' });
          await tab2Objects.accompanyingDocuments.inputFileUpload.setInputFiles(file2.filePath);
          await tab2Objects.accompanyingDocuments.btnAddAttachment.click();
        })(),
      ]);

      // Each tab must eventually land on /accompanying-documents with its own file visible + Safe.
      await expect(pages.accompanyingDocuments.documentsList).toBeVisible({
        timeout: fileUploadTimeouts.documentsListVisible,
      });
      await expect(pages.accompanyingDocuments.getStatusTag(file1.fileName)).toHaveText('Safe', {
        timeout: fileUploadTimeouts.virusScanComplete * 2,
      });

      await expect(tab2Objects.accompanyingDocuments.documentsList).toBeVisible({
        timeout: fileUploadTimeouts.documentsListVisible,
      });
      await expect(tab2Objects.accompanyingDocuments.getStatusTag(file2.fileName)).toHaveText('Safe', {
        timeout: fileUploadTimeouts.virusScanComplete * 2,
      });
    },
  );
});
