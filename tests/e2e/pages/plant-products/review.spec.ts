import { test, expect } from '@fixtures';

const plantUrl = (reference: string, slug = '') =>
  new RegExp(`^/plant-products/notifications/${reference}${slug ? `/${slug}` : ''}(?:\\?.*)?$`);

test.describe('Plant-products review page', { tag: '@integration' }, () => {
  test('renders all built cards and a Change round trip preserves the real persisted code', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const created = await apiJourney.createNotificationWithDocuments(1);
    await pages.reviewNotification.open(created.referenceNumber);
    await expect(pages.reviewNotification.heading).toBeVisible();
    await expect(pages.page.locator('main').getByRole('heading', { level: 2 })).toHaveText([
      'About the consignment',
      'Description of the goods',
      'Additional details',
      'Transport to the Border Control Post',
      'Goods movement services',
      'Contact details',
      'Nominated contacts',
      'Accompanying documents',
      'Traders',
    ]);
    await expect(pages.reviewNotification.value('Transport to the Border Control Post', 'Means of transport')).toHaveText('Vessel');
    await expect(pages.reviewNotification.value('Additional details', 'Total gross weight')).toHaveText('100.00');
    await expect(pages.reviewNotification.value('Additional details', 'Gross volume')).toHaveText('250.00');
    await pages.reviewNotification.changeLink('Transport to the Border Control Post', 'Means of transport').click();
    await expect(pages.page).toHaveURL((url) =>
      plantUrl(created.referenceNumber, 'transport-before-bip').test(`${url.pathname}${url.search}`),
    );
    await expect(pages.transportBeforeBip.meansOfTransport).toHaveValue('VESSEL');
    await pages.transportBeforeBip.saveAndContinue.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber, 'review-notification').test(url.pathname));
    expect((await plantProductsApi.load(created.referenceNumber)).transport?.meansOfTransport).toBe('VESSEL');
    await pages.reviewNotification.backLink.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber).test(url.pathname));
  });
});
