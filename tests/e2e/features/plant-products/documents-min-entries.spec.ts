import { test, expect } from '@fixtures';
import { documentTypes } from '@domain/plant-products/constants/document-types';

test(
  'the one-document floor locks and unlocks review in both directions',
  { tag: '@integration' },
  async ({ plantProductsApiJourney: apiJourney, plantProductsApi, plantProductsPages: pages }) => {
    const created = await apiJourney.createFullNotification();
    await pages.hub.open(created.referenceNumber);
    await expect(pages.hub.rowStatus('Accompanying documents')).toHaveText('Not yet started');
    await expect(pages.hub.rowStatus('Review and submit')).toHaveText('Cannot start yet');
    await expect(pages.hub.task('Review and submit')).toHaveCount(0);

    await pages.hub.task('Accompanying documents').click();
    await pages.accompanyingDocuments.documentType.selectOption(documentTypes.phytosanitaryCertificate.value);
    await pages.accompanyingDocuments.documentReference.fill('PHYTO-001');
    await pages.accompanyingDocuments.issueDate.fill('4/12/2025');
    await pages.accompanyingDocuments.addDocument.click();
    await pages.accompanyingDocuments.saveAndContinue.click();
    await expect(pages.hub.rowStatus('Accompanying documents')).toHaveText('Completed');
    await expect(pages.hub.task('Review and submit')).toBeVisible();
    expect((await plantProductsApi.listDocuments(created.referenceNumber)).documents).toHaveLength(1);

    await pages.hub.task('Accompanying documents').click();
    await pages.accompanyingDocuments.removeDocument(documentTypes.phytosanitaryCertificate.display, 'PHYTO-001').click();
    await pages.accompanyingDocuments.saveAndContinue.click();
    await expect(pages.hub.rowStatus('Accompanying documents')).toHaveText('Not yet started');
    await expect(pages.hub.rowStatus('Review and submit')).toHaveText('Cannot start yet');
    expect((await plantProductsApi.listDocuments(created.referenceNumber)).documents).toEqual([]);
  },
);
