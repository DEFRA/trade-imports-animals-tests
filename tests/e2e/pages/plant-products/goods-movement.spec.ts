import { test, expect } from '@fixtures';

const plantUrl = (reference: string, slug = '') =>
  new RegExp(`^/plant-products/notifications/${reference}${slug ? `/${slug}` : ''}(?:\\?.*)?$`);

test.describe('Plant-products goods movement page', { tag: '@integration' }, () => {
  test('pins the MRN gate in all three states and persists normalised enum and boolean values', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const created = await apiJourney.createFullNotification();
    const notification = await plantProductsApi.load(created.referenceNumber);
    await plantProductsApi.replace(created.referenceNumber, { ...notification, goodsMovementServices: null });
    await pages.goodsMovementServices.open(created.referenceNumber);

    await expect(pages.goodsMovementServices.heading).toBeVisible();
    await expect(pages.goodsMovementServices.movementReferenceNumber).toBeHidden();
    await pages.goodsMovementServices.commonTransitConvention('Yes – add MRN now').check();
    await pages.goodsMovementServices.usingGvms(true).check();
    await pages.goodsMovementServices.saveAndContinue.click();
    await expect(pages.goodsMovementServices.errorSummary.getByRole('link')).toHaveAttribute('href', '#movementReferenceNumber');

    await pages.goodsMovementServices.commonTransitConvention('Yes – add MRN later').check();
    await expect(pages.goodsMovementServices.movementReferenceNumber).toBeHidden();
    await pages.goodsMovementServices.saveAndContinue.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber).test(url.pathname));
    expect((await plantProductsApi.load(created.referenceNumber)).goodsMovementServices).toEqual({
      commonTransitConvention: 'ADD_MRN_LATER',
      movementReferenceNumber: null,
      usingGvms: true,
    });

    await pages.goodsMovementServices.open(created.referenceNumber, false);
    await expect(pages.goodsMovementServices.commonTransitConvention('Yes – add MRN later')).toBeChecked();
    await pages.goodsMovementServices.commonTransitConvention('No').check();
    await pages.goodsMovementServices.saveAndContinue.click();
    expect((await plantProductsApi.load(created.referenceNumber)).goodsMovementServices?.commonTransitConvention).toBe('NO');
    await expect(pages.hub.rowStatus('Goods movement services')).toHaveText('Completed');
  });

  test('links both unconditional errors and Back returns to the hub', async ({
    plantProductsApiJourney: apiJourney,
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const created = await apiJourney.createFullNotification();
    const notification = await plantProductsApi.load(created.referenceNumber);
    await plantProductsApi.replace(created.referenceNumber, { ...notification, goodsMovementServices: null });
    await pages.goodsMovementServices.open(created.referenceNumber);
    await pages.goodsMovementServices.saveAndContinue.click();
    expect(
      await pages.goodsMovementServices.errorSummary
        .getByRole('link')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
    ).toEqual(['#commonTransitConvention', '#usingGvms']);
    await pages.goodsMovementServices.backLink.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(created.referenceNumber).test(url.pathname));
  });
});
