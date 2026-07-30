import { test, expect } from '@fixtures';

test.describe('Commodity selection page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toCommoditySelection();
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.commoditySelection.heading).toBeVisible();
    await expect(pages.commoditySelection.searchInput).toBeVisible();
    await expect(pages.commoditySelection.searchButton).toBeVisible();
    await expect(pages.commoditySelection.saveAndContinue).toBeVisible();
  });

  test('shows an empty commodity search on load', async ({ pages }) => {
    await expect(pages.commoditySelection.searchInput).toHaveValue('');
  });

  test('accepts a valid commodity', async ({ pages }) => {
    await pages.commoditySelection.searchAndSelect('Cow', ['Bos taurus']);
    await pages.commoditySelection.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });
});
