import { test, expect } from '@fixtures';

const plantUrl = (reference: string, slug = '') =>
  new RegExp(`^/plant-products/notifications/${reference}${slug ? `/${slug}` : ''}(?:\\?.*)?$`);

test.describe('Plant-products declaration page', { tag: '@integration' }, () => {
  test('validates the flow-only checkbox and finalise persists the declaration timestamp', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const created = await apiJourney.createNotificationWithDocuments(1);
    const notification = await plantProductsApi.load(created.referenceNumber);
    await plantProductsApi.replace(created.referenceNumber, { ...notification, declaration: null });
    await pages.declaration.open(created.referenceNumber);
    await expect(pages.declaration.heading).toBeVisible();
    await expect(pages.declaration.declaration).not.toBeChecked();
    await pages.declaration.submitNotification.click();
    await expect(pages.declaration.errorSummary.getByRole('link')).toHaveAttribute('href', '#declaration');
    await pages.declaration.backLink.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber, 'review-notification').test(url.pathname));

    await pages.declaration.open(created.referenceNumber, false);
    await pages.declaration.declaration.check();
    await pages.declaration.submitNotification.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber, 'confirmation').test(url.pathname));
    const persisted = await plantProductsApi.load(created.referenceNumber);
    expect(persisted.status).toBe('SUBMITTED');
    expect(persisted.declaration?.agreed).toBe(true);
    expect(persisted.declaration?.declaredAt).toEqual(expect.any(String));
  });
});
