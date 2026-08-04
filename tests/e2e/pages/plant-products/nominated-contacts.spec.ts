import { test, expect } from '@fixtures';

const plantUrl = (reference: string) => new RegExp(`^/plant-products/notifications/${reference}(?:\\?.*)?$`);

test.describe('Plant-products nominated contacts page', { tag: '@integration' }, () => {
  test('keeps the optional row non-gating and persists ordered survivors after a middle removal', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsJourney: journey,
    plantProductsPages: pages,
  }) => {
    const created = await apiJourney.createFullNotification();
    const notification = await plantProductsApi.load(created.referenceNumber);
    await plantProductsApi.replace(created.referenceNumber, { ...notification, nominatedContacts: [] });
    await pages.nominatedContact.open(created.referenceNumber);

    await expect(pages.nominatedContact.heading).toBeVisible();
    await expect(pages.nominatedContact.summaryRows).toHaveCount(0);
    await pages.nominatedContact.addAnother.click();
    expect(
      await pages.nominatedContact.errorSummary.getByRole('link').evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
    ).toEqual(['#contactName', '#contactEmail']);

    await journey.fillNominatedContacts([
      { name: 'Nominated Agent', email: 'agent@example.com', isAgent: true },
      { name: 'Nominated Broker', telephone: '+44 7700 900125' },
      { name: 'Nominated Inspector', email: 'inspector@example.com' },
    ]);
    await expect(pages.nominatedContact.summaryRows).toHaveCount(4);
    await pages.nominatedContact.removeContact(2).click();
    await expect(pages.nominatedContact.summaryRows).toHaveCount(3);
    await journey.saveNominatedContacts();

    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber).test(url.pathname));
    await expect(pages.hub.rowStatus('Nominated contacts')).toHaveText('Completed');
    expect((await plantProductsApi.load(created.referenceNumber)).nominatedContacts).toEqual([
      { name: 'Nominated Agent', email: 'agent@example.com', telephone: null, isAgent: true },
      { name: 'Nominated Inspector', email: 'inspector@example.com', telephone: null, isAgent: false },
    ]);

    await pages.nominatedContact.open(created.referenceNumber, false);
    await expect(pages.nominatedContact.summaryRows.nth(1).getByRole('cell').first()).toHaveText('Nominated Agent');
    await expect(pages.nominatedContact.summaryRows.nth(2).getByRole('cell').first()).toHaveText('Nominated Inspector');
    await pages.nominatedContact.backLink.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber).test(url.pathname));
  });
});
