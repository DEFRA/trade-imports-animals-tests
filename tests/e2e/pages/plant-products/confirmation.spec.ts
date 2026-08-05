import { test, expect } from '@fixtures';

const plantUrl = (reference: string, slug = '') =>
  new RegExp(`^/plant-products/notifications/${reference}${slug ? `/${slug}` : ''}(?:\\?.*)?$`);

test.describe('Plant-products confirmation page', { tag: '@integration' }, () => {
  test('renders the post-submit panel and minted reference after a real finalise', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const created = await apiJourney.createNotificationWithDocuments(1);
    const notification = await plantProductsApi.load(created.referenceNumber);
    await plantProductsApi.replace(created.referenceNumber, { ...notification, declaration: null });
    await pages.declaration.open(created.referenceNumber);
    await pages.declaration.declaration.check();
    await pages.declaration.submitNotification.click();

    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber, 'confirmation').test(url.pathname));
    await expect(pages.confirmation.heading).toHaveClass(/govuk-panel__title/);
    await expect(pages.confirmation.referenceNumber).toHaveText(created.referenceNumber);
    await expect(pages.page.locator('body > .govuk-width-container').getByRole('link', { name: 'Back' })).toHaveCount(0);
    await pages.confirmation.returnToDashboard.click();
    await expect(pages.page).toHaveURL((url) => /^\/plant-products(?:\?.*)?$/.test(`${url.pathname}${url.search}`));
  });
});
