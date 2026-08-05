import { test, expect } from '@fixtures';
import { commodityCodes } from '@domain/plant-products/constants/commodity-codes';
import { eppoSpecies } from '@domain/plant-products/constants/eppo-species';
import { varieties, varietyClasses } from '@domain/plant-products/constants/varieties';
import type { VarietyTarget } from '@page-objects/plant-products/variety-of-genus-and-species-page';

const plantUrl = (reference: string, slug: string) => new RegExp(`^/plant-products/notifications/${reference}/${slug}(?:\\?.*)?$`);

const apples = commodityCodes.otherApples;
const mabsd = eppoSpecies[apples.value][0];
const mabsdTarget: VarietyTarget = {
  lineIndex: 0,
  speciesIndex: 0,
  ...mabsd,
};

test.describe('Plant-products variety and class page', { tag: '@integration' }, () => {
  test.beforeEach(async ({ plantProductsJourney: journey, plantProductsPages: pages }) => {
    await journey.startNotification();
    await pages.hub.task('Commodity').click();
    await pages.commodityInputMethod.method('Manual entry').check();
    await pages.commodityInputMethod.saveAndContinue.click();
    await pages.commoditySearch.search(apples.value);
    await pages.commodityBasicDescription.addSpecies(apples.value, mabsd.genusAndSpecies).click();
    await pages.commodityBasicDescription.saveAndContinue.click();
    await pages.varietyOfGenusAndSpecies.heading.waitFor();
  });

  test('renders only the shipped MABSD variety and class options and validates an empty first entry', async ({
    plantProductsPages: pages,
  }) => {
    await expect(pages.varietyOfGenusAndSpecies.variety(mabsdTarget).locator('option')).toHaveText([
      'Select a variety',
      ...varieties[apples.value].MABSD.map(({ display }) => display),
      'Other',
    ]);
    await expect(pages.varietyOfGenusAndSpecies.varietyClass(mabsdTarget).locator('option')).toHaveText([
      'Select a class',
      ...varietyClasses[apples.value].map(({ display }) => display),
    ]);

    await pages.varietyOfGenusAndSpecies.saveAndContinue.click();
    await expect(pages.varietyOfGenusAndSpecies.errorSummary).toContainText('At least one species variety must be added');
  });

  test('persists the variety ID rather than its display label, persists its class and resumes the saved row', async ({
    plantProductsApi,
    plantProductsPages: pages,
  }) => {
    const reference = pages.varietyOfGenusAndSpecies.journeyIdFromUrl();
    await pages.varietyOfGenusAndSpecies.variety(mabsdTarget).selectOption(varieties[apples.value].MABSD[2].value);
    await pages.varietyOfGenusAndSpecies.varietyClass(mabsdTarget).selectOption(varietyClasses[apples.value][2].value);
    await pages.varietyOfGenusAndSpecies.addAnother(mabsdTarget).click();
    await pages.varietyOfGenusAndSpecies.saveAndContinue.click();

    await expect(pages.page).toHaveURL((url) => plantUrl(reference, 'commodity-summary').test(`${url.pathname}${url.search}`));
    const persisted = (await plantProductsApi.load(reference)).commodity?.commodityComplement?.[0]?.species?.[0]?.varieties?.[0];
    expect(persisted).toEqual({
      variety: varieties[apples.value].MABSD[2].value,
      varietyClass: varietyClasses[apples.value][2].value,
    });
    expect(persisted?.variety).not.toBe(varieties[apples.value].MABSD[2].display);

    await pages.commoditySummary.addSpeciesTo(0).click();
    await pages.commodityBasicDescription.saveAndContinue.click();
    const savedRow = pages.varietyOfGenusAndSpecies.rows(mabsdTarget);
    await expect(savedRow).toHaveCount(1);
    await expect(savedRow.getByRole('cell').nth(0)).toHaveText(varieties[apples.value].MABSD[2].display);
    await expect(savedRow.getByRole('cell').nth(1)).toHaveText(varietyClasses[apples.value][2].display);
    await expect(
      savedRow.getByRole('button', {
        name: 'Remove Royal Gala, Extra Class from commodity line 1, species 1: MABSD - Malus domestica',
      }),
    ).toBeVisible();
    await pages.varietyOfGenusAndSpecies.backLink.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(reference, 'commodity-basic-description').test(`${url.pathname}${url.search}`));
  });
});

test(
  'CIDAC persists its real variety without rendering or fabricating a class',
  {
    tag: '@integration',
  },
  async ({ plantProductsApi, plantProductsJourney: journey, plantProductsPages: pages }) => {
    const citrus = commodityCodes.otherCitrus;
    const cidac = eppoSpecies[citrus.value][0];
    const cidacTarget: VarietyTarget = { lineIndex: 0, speciesIndex: 0, ...cidac };
    const reference = await journey.startNotification();
    await pages.hub.task('Commodity').click();
    await pages.commodityInputMethod.method('Manual entry').check();
    await pages.commodityInputMethod.saveAndContinue.click();
    await pages.commoditySearch.search(citrus.value);
    await pages.commodityBasicDescription.addSpecies(citrus.value, cidac.genusAndSpecies).click();
    await pages.commodityBasicDescription.saveAndContinue.click();
    await expect(pages.varietyOfGenusAndSpecies.heading).toBeVisible();
    await expect(pages.varietyOfGenusAndSpecies.varietyClass(cidacTarget)).toHaveCount(0);

    await pages.varietyOfGenusAndSpecies.variety(cidacTarget).selectOption(varieties[citrus.value].CIDAC[0].value);
    await pages.varietyOfGenusAndSpecies.addAnother(cidacTarget).click();
    await pages.varietyOfGenusAndSpecies.saveAndContinue.click();

    await expect(pages.page).toHaveURL((url) => plantUrl(reference, 'commodity-summary').test(`${url.pathname}${url.search}`));
    await expect(pages.commoditySummary.classesOf(0, 0)).toHaveText('');
    const persisted = (await plantProductsApi.load(reference)).commodity?.commodityComplement?.[0]?.species?.[0]?.varieties?.[0];
    expect(persisted).toEqual({
      variety: varieties[citrus.value].CIDAC[0].value,
      varietyClass: null,
    });
  },
);
