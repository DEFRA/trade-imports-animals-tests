import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class TransportBeforeBipPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'transport-before-bip', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Transport to the Border Control Post (BCP)' });
  }

  get borderControlPost(): Locator {
    return this.page.getByLabel('Entry border control post');
  }

  get inspectionPremises(): Locator {
    return this.page.getByLabel('Inspection premises');
  }

  inspectionPremisesOptions(): Locator {
    return this.inspectionPremises.getByRole('option');
  }

  get meansOfTransport(): Locator {
    return this.page.getByLabel('Means of transport to the BCP', { exact: true });
  }

  get transportIdentification(): Locator {
    return this.page.getByLabel('Transport identification');
  }

  get transportDocumentReference(): Locator {
    return this.page.getByLabel('Transport document reference');
  }

  get arrivalDateDay(): Locator {
    return this.page.getByLabel('Day', { exact: true });
  }

  get arrivalDateMonth(): Locator {
    return this.page.getByLabel('Month', { exact: true });
  }

  get arrivalDateYear(): Locator {
    return this.page.getByLabel('Year', { exact: true });
  }

  get arrivalTimeHour(): Locator {
    return this.page.getByLabel('Hour', { exact: true });
  }

  get arrivalTimeMinute(): Locator {
    return this.page.getByLabel('Minutes', { exact: true });
  }

  usesContainers(value: boolean): Locator {
    return this.page.getByRole('radio', { name: value ? 'Yes' : 'No', exact: true });
  }

  get containerNumber(): Locator {
    return this.page.getByLabel('Container or trailer number');
  }

  get sealNumber(): Locator {
    return this.page.getByLabel('Seal number');
  }

  get officialSeal(): Locator {
    return this.page.getByLabel('This is an official seal', { exact: true });
  }

  get addContainer(): Locator {
    return this.page.getByRole('button', { name: 'Add another container or trailer' });
  }

  removeContainer(number: string): Locator {
    return this.page.getByRole('row').filter({ hasText: number }).getByRole('button', { name: 'Remove' });
  }

  get containerRows(): Locator {
    return this.page.locator('main').getByRole('table', { name: 'Containers and trailers added' }).getByRole('row');
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get backLink(): Locator {
    return this.page.locator('body > .govuk-width-container').getByRole('link', { name: 'Back', exact: true });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('alert');
  }
}
