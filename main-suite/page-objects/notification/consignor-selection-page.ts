import { Locator } from '@playwright/test';
import { BasePage } from '@main-page-objects/base/base-page';

export class ConsignorSelectionPage extends BasePage {
  readonly expectedUrl = '/consignors/select';

  get referenceNumber(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'GBN-AG' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Search for an existing consignor or exporter' });
  }

  get groupSelectConsignorOrExporter(): Locator {
    return this.page.getByRole('group', { name: 'Select a consignor or exporter' });
  }

  radioConsignorOrExporter(name: string): Locator {
    return this.groupSelectConsignorOrExporter.getByRole('radio', { name: new RegExp(name) });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get errorSummaryItems(): Locator {
    return this.page
      .getByRole('alert')
      .filter({ has: this.page.getByRole('heading', { name: 'There is a problem' }) })
      .getByRole('link');
  }
}
