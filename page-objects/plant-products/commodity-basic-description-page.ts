import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class CommodityBasicDescriptionPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'commodity-basic-description', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Commodity' });
  }

  line(code: string): Locator {
    return this.page.getByRole('region', { name: `Commodity ${code}` });
  }

  speciesResults(code: string): Locator {
    return this.page.getByRole('table', { name: `Genus (and Species) search results ${code}` });
  }

  addedSpecies(code: string): Locator {
    return this.page.getByRole('table', { name: `Added Genus (and Species) ${code}` });
  }

  addSpecies(code: string, genusAndSpecies: string): Locator {
    return this.speciesResults(code).getByRole('button', {
      name: `Add ${genusAndSpecies} to commodity ${code}`,
    });
  }

  removeSpecies(code: string, genusAndSpecies: string): Locator {
    return this.addedSpecies(code).getByRole('button', {
      name: `Remove ${genusAndSpecies} from commodity ${code}`,
    });
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get backLink(): Locator {
    return this.page.getByRole('link', { name: 'Back', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'There is a problem' }) });
  }
}
