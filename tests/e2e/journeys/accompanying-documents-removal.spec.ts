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

    const rows = pages.page.locator('.govuk-table__row[data-upload-id]');
    await expect(rows).toHaveCount(2);

    // Wait for all scans to complete
    await expect(pages.accompanyingDocuments.btnSaveAndContinueEnabled).toBeVisible({ timeout: 30000 });

    // Capture reference number before navigating away
    const ref = (await pages.page.locator('[data-testid="app-reference-number-caption"]').textContent()).trim();

    // Remove the first document
    await pages.accompanyingDocuments.getBtnRemove('test-document.pdf').first().click();
    await expect(pages.page).toHaveURL(pages.accompanyingDocuments.expectedUrl);
    await expect(rows).toHaveCount(1);

    // Save and continue — completes the frontend flow
    await pages.accompanyingDocuments.btnSaveAndContinueEnabled.click();

    // ── Cross to admin ────────────────────────────────────────────────────────

    await pages.page.goto(`${adminBaseUrl}/notifications/${ref}`);

    // The admin may redirect through DCID. If the sign-in form appears, the
    // DCID session from the frontend journey did not carry over — sign in again.
    const signInVisible = await pages.signIn.inputUserId.isVisible({ timeout: 5000 }).catch(() => false);

    if (signInVisible) {
      await pages.signIn.signIn();
    }

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
