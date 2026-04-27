import path from 'path';
import { fileURLToPath } from 'url';
import { test, expect } from '@fixtures';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Cross-service regression test for the accompanying document removal bug.
 *
 * Verifies that removing a document in the frontend also removes it from the
 * backend, so the admin notification view shows the correct document count.
 *
 * Auth note: the frontend journey signs in via DCID. When we navigate to the
 * admin service (different origin), the existing DCID session cookie in the
 * browser should satisfy the admin's auth challenge silently via SSO. If not,
 * we fall back to an explicit sign-in.
 */
test(
  'removed document does not appear on the admin notification view',
  { tag: ['@integration', '@cross-service'] },
  async ({ pages, journeys, adminBaseUrl }) => {
    await journeys.toAccompanyingDocuments();

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

    // Wait for all scans to complete
    await expect(pages.accompanyingDocuments.btnSaveAndContinueEnabled).toBeVisible({ timeout: 30000 });

    // Capture reference number before navigating away
    const ref = await pages.accompanyingDocuments.referenceNumberCaption.innerText();

    // Remove the first document
    await pages.accompanyingDocuments.getBtnRemove('test-document.pdf').first().click(); // two docs share this filename
    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(pages.accompanyingDocuments.documentRows).toHaveCount(1);

    // Save and continue — completes the frontend flow
    await pages.accompanyingDocuments.btnSaveAndContinueEnabled.click();

    // ── Cross to admin ────────────────────────────────────────────────────────

    // Navigate to the admin root to trigger the auth redirect, sign in, then
    // proceed to the specific notification. The frontend and admin are on
    // different origins so no SSO session carries over automatically.
    await pages.page.goto(`${adminBaseUrl}/`);
    if (await pages.signIn.heading.isVisible()) {
      await pages.signIn.signIn();
    }
    await pages.page.goto(`${adminBaseUrl}/notifications/${ref}`);

    // Wait for the admin notification view to load
    await expect(pages.adminNotificationView.sectionAccompanyingDocuments).toBeVisible({
      timeout: 15000,
    });

    // Only 1 document should appear — the one the user did NOT remove
    await expect(pages.adminNotificationView.documentHeadings).toHaveCount(1);
    await expect(pages.adminNotificationView.documentSectionByReference('REF-002')).toBeVisible();
    await expect(pages.adminNotificationView.documentSectionByReference('REF-001')).not.toBeVisible();

    // The kept document should be Safe and its file should be downloadable
    await expect(pages.adminNotificationView.documentScanStatusByReference('REF-002')).toHaveText('Safe');

    const [download] = await Promise.all([
      pages.page.waitForEvent('download'),
      pages.adminNotificationView.documentFileLinkByReference('REF-002').click(),
    ]);
    expect(download.suggestedFilename()).toBe('test-document.pdf');
  },
);
