import { test, expect } from '@fixtures';
import { commodityCodes } from '@domain/plant-products/constants/commodity-codes';
import { eppoSpecies } from '@domain/plant-products/constants/eppo-species';
import { varieties, varietyClasses } from '@domain/plant-products/constants/varieties';
import type { VarietyTarget } from '@page-objects/plant-products/variety-of-genus-and-species-page';

const plantUrl = (reference: string, slug: string) => new RegExp(`^/plant-products/notifications/${reference}/${slug}(?:\\?.*)?$`);

const citrus = commodityCodes.otherCitrus;
const cidac = eppoSpecies[citrus.value][0];
const cidacTarget: VarietyTarget = {
  lineIndex: 0,
  speciesIndex: 0,
  ...cidac,
};

test.describe('Plant-products variety and class page', { tag: '@integration' }, () => {
  test.beforeEach(async ({ plantProductsJourney: journey, plantProductsPages: pages }) => {
    await journey.startNotification();
    await pages.hub.task('Commodity').click();
    await pages.commodityInputMethod.method('Manual entry').check();
    await pages.commodityInputMethod.saveAndContinue.click();
    await pages.commoditySearch.search(citrus.value);
    await pages.commodityBasicDescription.addSpecies(citrus.value, cidac.genusAndSpecies).click();
    await pages.commodityBasicDescription.saveAndContinue.click();
    await pages.varietyOfGenusAndSpecies.heading.waitFor();
  });

  test('renders only the shipped CIDAC variety and class options and validates an empty first entry', async ({
    plantProductsPages: pages,
  }) => {
    await expect(pages.varietyOfGenusAndSpecies.variety(cidacTarget).locator('option')).toHaveText([
      'Select a variety',
      varieties.CIDAC[0].display,
      'Other',
    ]);
    await expect(pages.varietyOfGenusAndSpecies.varietyClass(cidacTarget).locator('option')).toHaveText([
      'Select a class',
      ...varietyClasses.CIDAC.map(({ display }) => display),
    ]);

    await pages.varietyOfGenusAndSpecies.saveAndContinue.click();
    await expect(pages.varietyOfGenusAndSpecies.errorSummary).toContainText('At least one species variety must be added');
  });

  test('persists the variety ID rather than its display label, persists its class and resumes the saved row', async ({
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const reference = pages.varietyOfGenusAndSpecies.journeyIdFromUrl();
    await pages.varietyOfGenusAndSpecies.variety(cidacTarget).selectOption(varieties.CIDAC[0].value);
    await pages.varietyOfGenusAndSpecies.varietyClass(cidacTarget).selectOption(varietyClasses.CIDAC[0].value);
    await pages.varietyOfGenusAndSpecies.addAnother(cidacTarget).click();
    await pages.varietyOfGenusAndSpecies.saveAndContinue.click();

    await expect(pages.page).toHaveURL((url) => plantUrl(reference, 'commodity-summary').test(`${url.pathname}${url.search}`));
    const persisted = (await plantProductsApi.load(reference)).commodity?.commodityComplement?.[0]?.species?.[0]?.varieties?.[0];
    expect(persisted).toEqual({
      variety: varieties.CIDAC[0].value,
      varietyClass: varietyClasses.CIDAC[0].value,
    });
    expect(persisted?.variety).not.toBe(varieties.CIDAC[0].display);

    await pages.commoditySummary.addSpeciesTo(0).click();
    await pages.commodityBasicDescription.saveAndContinue.click();
    const savedRow = pages.varietyOfGenusAndSpecies.rows(cidacTarget);
    await expect(savedRow).toHaveCount(1);
    await expect(savedRow.getByRole('cell').nth(0)).toHaveText(varieties.CIDAC[0].display);
    await expect(savedRow.getByRole('cell').nth(1)).toHaveText(varietyClasses.CIDAC[0].display);
    await expect(
      savedRow.getByRole('button', {
        name: 'Remove None, Class I from commodity line 1, species 1: CIDAC - Citrus australasica',
      }),
    ).toBeVisible();
    await pages.varietyOfGenusAndSpecies.backLink.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(reference, 'commodity-basic-description').test(`${url.pathname}${url.search}`));
  });
});

test(
  'MABSD has real varieties but no classes, so the UI correctly creates no variety entry instead of fabricating a class',
  {
    tag: '@integration',
  },
  async ({ plantProductsApi, plantProductsJourney: journey, plantProductsPages: pages }) => {
    const apples = commodityCodes.ciderApples;
    const mabsd = eppoSpecies[apples.value][0];
    const reference = await journey.startNotification();
    await pages.hub.task('Commodity').click();
    await pages.commodityInputMethod.method('Manual entry').check();
    await pages.commodityInputMethod.saveAndContinue.click();
    await pages.commoditySearch.search(apples.value);
    await pages.commodityBasicDescription.addSpecies(apples.value, mabsd.genusAndSpecies).click();
    await pages.commodityBasicDescription.saveAndContinue.click();

    await expect(pages.page).toHaveURL((url) => plantUrl(reference, 'commodity-summary').test(`${url.pathname}${url.search}`));
    const persisted = (await plantProductsApi.load(reference)).commodity?.commodityComplement?.[0]?.species?.[0];
    expect(persisted).toMatchObject(mabsd);
    expect(persisted?.varieties).toEqual([]);
  },
);
