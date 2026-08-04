import { test, expect } from '@fixtures';

test.describe('Plant-products nominated contacts remain optional', { tag: '@integration' }, () => {
  test('two contacts survive a middle removal by identity and order while review remains available', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsJourney: journey,
    plantProductsPages: pages,
  }) => {
    const created = await apiJourney.createNotificationWithDocuments(1);
    const notification = await plantProductsApi.load(created.referenceNumber);
    await plantProductsApi.replace(created.referenceNumber, { ...notification, nominatedContacts: [] });
    await pages.nominatedContact.open(created.referenceNumber);
    await journey.fillNominatedContacts([
      { name: 'Nominated Agent', email: 'agent@example.com', isAgent: true },
      { name: 'Nominated Broker', telephone: '+44 7700 900125' },
      { name: 'Nominated Inspector', email: 'inspector@example.com' },
    ]);
    await pages.nominatedContact.removeContact(2).click();
    await pages.nominatedContact.saveAndContinue.click();
    expect((await plantProductsApi.load(created.referenceNumber)).nominatedContacts?.map(({ name }) => name)).toEqual([
      'Nominated Agent',
      'Nominated Inspector',
    ]);
    await expect(pages.hub.task('Review and submit')).toBeVisible();
  });

  test('a complete real journey submits with zero nominated contacts', async ({
    plantProductsJourney: journey,
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    test.setTimeout(120_000);
    const reference = await journey.startNotification();
    await journey.completeMandatorySpokes();
    await expect(pages.hub.rowStatus('Nominated contacts')).toHaveText('Optional');
    await journey.reviewAndSubmit();
    await expect(pages.confirmation.referenceNumber).toHaveText(reference);
    const persisted = await plantProductsApi.load(reference);
    expect(persisted.status).toBe('SUBMITTED');
    expect(persisted.nominatedContacts).toEqual([]);
  });
});
