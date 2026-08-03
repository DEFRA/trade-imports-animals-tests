import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class CommoditySummaryPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'commodity-summary', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Commodity' });
  }

  line(index: number): Locator {
    return this.page.getByRole('table', { name: 'Commodity summary table' }).nth(index);
  }

  speciesOf(lineIndex: number): Locator {
    return this.line(lineIndex)
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell') });
  }

  varietiesOf(lineIndex: number, speciesIndex: number): Locator {
    return this.speciesOf(lineIndex).nth(speciesIndex).getByRole('cell').nth(3).locator('span');
  }

  classesOf(lineIndex: number, speciesIndex: number): Locator {
    return this.speciesOf(lineIndex).nth(speciesIndex).getByRole('cell').nth(4).locator('span');
  }

  removeSpecies(lineIndex: number, speciesIndex: number, genusAndSpecies: string, commodityCode: string): Locator {
    return this.line(lineIndex).getByRole('button', {
      name: `Remove ${genusAndSpecies} from commodity line ${lineIndex + 1}, species ${speciesIndex + 1}: ${commodityCode}`,
    });
  }

  addSpeciesTo(lineIndex: number): Locator {
    return this.page.getByRole('link', { name: 'Add another Genus (and Species)', exact: true }).nth(lineIndex);
  }

  get addAnotherCommodity(): Locator {
    return this.page.getByRole('button', { name: 'Add another commodity' });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get backLink(): Locator {
    return this.page.getByRole('link', { name: 'Back', exact: true });
  }
}
