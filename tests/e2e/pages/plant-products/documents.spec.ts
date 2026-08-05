import { test, expect } from '@fixtures';
import { documentTypes } from '@domain/plant-products/constants/document-types';

const plantUrl = (reference: string) => new RegExp(`^/plant-products/notifications/${reference}(?:\\?.*)?$`);

test.describe('Plant-products accompanying documents page', { tag: '@integration' }, () => {
  test('renders all 16 built types, validates every metadata field, saves codes and resumes through the sub-resource', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const created = await apiJourney.createFullNotification();
    await pages.accompanyingDocuments.open(created.referenceNumber);
    await expect(pages.accompanyingDocuments.heading).toBeVisible();
    await expect(pages.accompanyingDocuments.documentType.getByRole('option')).toHaveText([
      'Select document type',
      ...Object.values(documentTypes).map(({ display }) => display),
    ]);
    await pages.accompanyingDocuments.addDocument.click();
    await expect
      .poll(() =>
        pages.accompanyingDocuments.errorSummary.getByRole('link').evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
      )
      .toEqual(['#documentType', '#documentReference', '#issueDate']);

    await pages.accompanyingDocuments.documentType.selectOption(documentTypes.phytosanitaryCertificate.value);
    await pages.accompanyingDocuments.documentReference.fill('PHYTO-001');
    await pages.accompanyingDocuments.issueDate.fill('4/12/2025');
    await pages.accompanyingDocuments.addDocument.click();
    await pages.accompanyingDocuments.saveAndContinue.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber).test(url.pathname));
    await expect(pages.hub.rowStatus('Accompanying documents')).toHaveText('Completed');
    expect((await plantProductsApi.listDocuments(created.referenceNumber)).documents).toMatchObject([
      { documentType: documentTypes.phytosanitaryCertificate.value, documentReference: 'PHYTO-001', issueDate: '2025-12-04' },
    ]);

    await pages.accompanyingDocuments.open(created.referenceNumber, false);
    // This document is added by metadata alone, so the file column reads "No file".
    await expect(pages.accompanyingDocuments.summaryRows.nth(1).getByRole('cell')).toHaveText([
      documentTypes.phytosanitaryCertificate.display,
      'PHYTO-001',
      '4/12/2025',
      'No file',
      `Remove ${documentTypes.phytosanitaryCertificate.display} PHYTO-001`,
    ]);
    await pages.accompanyingDocuments.backLink.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber).test(url.pathname));
  });
});
