import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class PlantOriginOfImportPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'origin-of-import', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Origin of the import' });
  }

  get countryOfConsignment(): Locator {
    return this.page.getByLabel('Country from where consigned', { exact: true });
  }

  get internalReference(): Locator {
    return this.page.getByLabel('Add a reference number for this consignment (optional)', { exact: true });
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

  get countryOfConsignmentError(): Locator {
    return this.page.locator('#countryOfConsignment-error');
  }

  get internalReferenceError(): Locator {
    return this.page.locator('#internalReference-error');
  }

  async selectCountry(label: string): Promise<void> {
    await this.countryOfConsignment.selectOption({ label });
  }
}
