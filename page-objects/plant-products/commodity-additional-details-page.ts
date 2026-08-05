import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class CommodityAdditionalDetailsPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'commodity-additional-details', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Additional details' });
  }

  get totalGrossWeight(): Locator {
    return this.page.getByLabel('Total gross weight (kg)');
  }

  get grossVolume(): Locator {
    return this.page.getByLabel('Total gross volume (optional)');
  }

  get grossVolumeUnit(): Locator {
    return this.page.getByLabel('Unit');
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
