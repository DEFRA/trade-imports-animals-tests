import { test, expect } from '@fixtures';

const expectedGroups = [
  ['Cow (0102)', ['Bison bison', 'Bos spp.', 'Bos taurus', 'Bubalus bubalis']],
  ['Horse (0101)', ['Equus caballus']],
  ['Cat (01061900)', ['Felis catus']],
  ['Dog (01061900)', ['Canis lupus familiaris']],
  ['Fish (0301)', ['Salmo salar']],
] as const;

test.describe('Commodity selection page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toCommoditySelection();
  });

  test('renders the full grouped checklist', async ({ pages }) => {
    await expect(pages.commoditySelection.heading).toBeVisible();
    for (const [legend, species] of expectedGroups) {
      const group = pages.page.getByRole('group', { name: legend });
      await expect(group).toBeVisible();
      for (const name of species) {
        await expect(group.getByRole('checkbox', { name })).toBeVisible();
      }
    }
    await expect(pages.page.getByRole('checkbox')).toHaveCount(8);
    await expect(pages.commoditySelection.saveAndContinue).toBeVisible();
  });

  test('accepts and persists multiple commodity-species pairs', async ({ pages }) => {
    await pages.commoditySelection.selectSpecies(['Bos taurus', 'Felis catus']);
    await pages.commoditySelection.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);

    await pages.consignmentDetails.linkBack.click();
    await expect(pages.commoditySelection.species('Bos taurus')).toBeChecked();
    await expect(pages.commoditySelection.species('Felis catus')).toBeChecked();
  });

  test('shows an error summary when submitted empty', async ({ pages }) => {
    await pages.commoditySelection.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });
});
