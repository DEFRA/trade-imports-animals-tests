import { type Locator, type Page } from '@playwright/test';
import { test, expect } from '@fixtures';
import { commodityCodes } from '@domain/plant-products/constants/commodity-codes';
import { eppoSpecies } from '@domain/plant-products/constants/eppo-species';
import { varieties, varietyClasses } from '@domain/plant-products/constants/varieties';
import type { CommodityLine, PlantProductsNotificationResponse } from '@domain/plant-products/models/api/notification';
import type { PlantCommodityLineOptions } from '@flows/plant-products/journey';

const plantUrl = (reference: string, slug: string) => new RegExp(`^/plant-products/notifications/${reference}/${slug}(?:\\?.*)?$`);

const foliage = commodityCodes.otherFoliage;
const [crataegomespilus, lens] = eppoSpecies[foliage.value];
const apples = commodityCodes.otherApples;
const mabsd = eppoSpecies[apples.value][0];
const mabsdVarieties = varieties[apples.value].MABSD.map(({ value }, index) => ({
  variety: value,
  varietyClass: varietyClasses[apples.value][index].value,
}));

const lines: PlantCommodityLineOptions[] = [
  {
    commodityCode: foliage.value,
    commodityDescription: foliage.display,
    species: [crataegomespilus, lens],
  },
  {
    commodityCode: apples.value,
    commodityDescription: apples.display,
    species: [{ ...mabsd, varieties: mabsdVarieties }],
  },
];

const summaryTables = (page: Page): Locator => page.getByRole('table', { name: 'Commodity summary table' });
const speciesRows = (page: Page, lineIndex: number): Locator =>
  summaryTables(page)
    .nth(lineIndex)
    .getByRole('row')
    .filter({ has: page.getByRole('cell') });

const normalisedCells = async (row: Locator): Promise<string[]> =>
  (await row.getByRole('cell').allInnerTexts()).map((text) => text.trim().replace(/\s+/g, ' '));

const persistedTree = (notification: PlantProductsNotificationResponse) =>
  (notification.commodity?.commodityComplement ?? []).map((line) => ({
    uniqueComplementId: line.uniqueComplementId,
    commodityCode: line.commodityCode,
    commodityDescription: line.commodityDescription,
    species: (line.species ?? []).map((species) => ({
      eppoCode: species.eppoCode,
      genusAndSpecies: species.genusAndSpecies,
      speciesId: species.speciesId,
      varieties: species.varieties ?? [],
    })),
  }));

const expectInitialDomTree = async (page: Page): Promise<void> => {
  await expect(summaryTables(page)).toHaveCount(2);
  await expect(speciesRows(page, 0)).toHaveCount(2);
  expect(await normalisedCells(speciesRows(page, 0).nth(0))).toEqual([
    foliage.value,
    crataegomespilus.genusAndSpecies,
    crataegomespilus.eppoCode,
    '',
    '',
    'Remove',
  ]);
  expect(await normalisedCells(speciesRows(page, 0).nth(1))).toEqual([
    foliage.value,
    lens.genusAndSpecies,
    lens.eppoCode,
    '',
    '',
    'Remove',
  ]);
  await expect(speciesRows(page, 1)).toHaveCount(1);
  expect(await normalisedCells(speciesRows(page, 1))).toEqual([
    apples.value,
    mabsd.genusAndSpecies,
    mabsd.eppoCode,
    'McIntosh Red Spartan Royal Gala',
    'Class I Class II Extra Class',
    '',
  ]);
};

const expectedInitialTree = (ids: Array<string | null | undefined>) => [
  {
    uniqueComplementId: ids[0],
    commodityCode: foliage.value,
    commodityDescription: foliage.display,
    species: [
      { ...crataegomespilus, varieties: [] },
      { ...lens, varieties: [] },
    ],
  },
  {
    uniqueComplementId: ids[1],
    commodityCode: apples.value,
    commodityDescription: apples.display,
    species: [{ ...mabsd, varieties: mabsdVarieties }],
  },
];

test(
  'depth-3 commodity tree stays ordered in the UI and persisted document across real fixture removals',
  {
    tag: '@integration',
  },
  async ({ page, plantProductsApi, plantProductsJourney: journey }) => {
    const reference = await journey.startNotification();
    await journey.answerCommodities({ lines, returnAtSummary: true });
    await expect(page).toHaveURL((url) => plantUrl(reference, 'commodity-summary').test(`${url.pathname}${url.search}`));

    await expectInitialDomTree(page);
    const initial = await plantProductsApi.load(reference);
    expect(initial.commodity?.inputMethod).toBe('MANUAL');
    const ids = (initial.commodity?.commodityComplement ?? []).map((line: CommodityLine) => line.uniqueComplementId);
    // The real backend currently echoes null for UI-created lines rather than assigning IDs.
    // Keep the assertion explicit so pp-063 reports the upstream contract gap instead of inventing test-side IDs.
    expect(ids).toEqual([null, null]);
    expect(persistedTree(initial)).toEqual(expectedInitialTree(ids));

    // MABSD has three real varieties and three real classes, so Spartan is a genuine middle removal.
    await journey.removeVariety(1, 0, lines[1].species[0], 'Spartan', 'Class II');
    await expect(summaryTables(page)).toHaveCount(2);
    await expect(speciesRows(page, 0)).toHaveCount(2);
    expect(await normalisedCells(speciesRows(page, 0).nth(0))).toEqual([
      foliage.value,
      crataegomespilus.genusAndSpecies,
      crataegomespilus.eppoCode,
      '',
      '',
      'Remove',
    ]);
    expect(await normalisedCells(speciesRows(page, 0).nth(1))).toEqual([
      foliage.value,
      lens.genusAndSpecies,
      lens.eppoCode,
      '',
      '',
      'Remove',
    ]);
    expect(await normalisedCells(speciesRows(page, 1))).toEqual([
      apples.value,
      mabsd.genusAndSpecies,
      mabsd.eppoCode,
      'McIntosh Red Royal Gala',
      'Class I Extra Class',
      '',
    ]);
    const afterVarietyRemoval = await plantProductsApi.load(reference);
    expect(persistedTree(afterVarietyRemoval)).toEqual([
      expectedInitialTree(ids)[0],
      {
        ...expectedInitialTree(ids)[1],
        species: [
          {
            ...mabsd,
            varieties: [mabsdVarieties[0], mabsdVarieties[2]],
          },
        ],
      },
    ]);

    // The complete fixture has only two species under its sole multi-species commodity.
    // Remove the non-last first entry without fabricating a third species association.
    await journey.removeSpecies(0, 0, crataegomespilus.genusAndSpecies, foliage.value);
    await expect(summaryTables(page)).toHaveCount(2);
    await expect(speciesRows(page, 0)).toHaveCount(1);
    expect(await normalisedCells(speciesRows(page, 0))).toEqual([foliage.value, lens.genusAndSpecies, lens.eppoCode, '', '', '']);
    expect(await normalisedCells(speciesRows(page, 1))).toEqual([
      apples.value,
      mabsd.genusAndSpecies,
      mabsd.eppoCode,
      'McIntosh Red Royal Gala',
      'Class I Extra Class',
      '',
    ]);

    const afterSpeciesRemoval = await plantProductsApi.load(reference);
    expect(persistedTree(afterSpeciesRemoval)).toEqual([
      {
        ...expectedInitialTree(ids)[0],
        species: [{ ...lens, varieties: [] }],
      },
      {
        ...expectedInitialTree(ids)[1],
        species: [{ ...mabsd, varieties: [mabsdVarieties[0], mabsdVarieties[2]] }],
      },
    ]);
    expect(afterSpeciesRemoval.commodity?.commodityComplement?.map(({ uniqueComplementId }) => uniqueComplementId)).toEqual(ids);
  },
);
