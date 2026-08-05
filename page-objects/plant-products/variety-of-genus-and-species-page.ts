import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export type VarietyTarget = {
  lineIndex: number;
  speciesIndex: number;
  eppoCode: string;
  genusAndSpecies: string;
};

export class VarietyOfGenusAndSpeciesPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'variety-of-genus-and-species', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Variety and class of commodity' });
  }

  context(target: VarietyTarget): string {
    return `for commodity line ${target.lineIndex + 1}, species ${target.speciesIndex + 1}: ${target.eppoCode} - ${target.genusAndSpecies}`;
  }

  species(target: VarietyTarget): Locator {
    return this.page.getByRole('region', { name: `${target.eppoCode} - ${target.genusAndSpecies}` });
  }

  variety(target: VarietyTarget): Locator {
    return this.page.getByLabel(`Variety ${this.context(target)}`);
  }

  varietyClass(target: VarietyTarget): Locator {
    return this.page.getByLabel(`Class ${this.context(target)}`);
  }

  addAnother(target: VarietyTarget): Locator {
    return this.page.getByRole('button', { name: `Add another variety ${this.context(target)}` });
  }

  rows(target: VarietyTarget): Locator {
    return this.species(target)
      .getByRole('table', { name: `Added varieties and classes ${this.context(target)}` })
      .getByRole('row')
      .filter({
        has: this.page.getByRole('cell'),
      });
  }

  remove(target: VarietyTarget, varietyLabel: string, classLabel: string): Locator {
    return this.species(target).getByRole('button', {
      name: `Remove ${varietyLabel}, ${classLabel} from commodity line ${target.lineIndex + 1}, species ${target.speciesIndex + 1}: ${target.eppoCode} - ${target.genusAndSpecies}`,
    });
  }

  get addAnotherSpecies(): Locator {
    return this.page.getByRole('link', { name: 'Add another Genus (and species)' });
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
