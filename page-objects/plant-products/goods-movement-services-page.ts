import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class GoodsMovementServicesPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'goods-movement-services', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Goods movement services' });
  }

  commonTransitConvention(label: 'Yes – add MRN now' | 'Yes – add MRN later' | 'No'): Locator {
    return this.page
      .getByRole('group', { name: /Are you using the Common Transit Convention/ })
      .getByRole('radio', { name: label, exact: true });
  }

  get movementReferenceNumber(): Locator {
    return this.page.getByLabel('Movement Reference Number (MRN)', { exact: true });
  }

  usingGvms(value: boolean): Locator {
    return this.page
      .getByRole('group', { name: /Will the transport use the Goods Vehicle Movement Service/ })
      .getByRole('radio', { name: value ? 'Yes' : 'No', exact: true });
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
