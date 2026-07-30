import { Locator } from '@playwright/test';
import { BasePage } from '@main-page-objects/base/base-page';
import { CommoditySpecies } from '@main-domain/constants/commodity-species';

export class SpeciesSelectionPage extends BasePage {
  readonly expectedUrl = '/commodities/select';

  get referenceNumber(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'GBN-AG' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Commodity' });
  }

  get tableCommodities(): Locator {
    return this.page.getByRole('table', { name: 'Commodities' });
  }

  get rowsCommodities(): Locator {
    return this.tableCommodities.locator('tbody').getByRole('row');
  }

  cellsCommodities(rowIndex: number): Locator {
    return this.rowsCommodities.nth(rowIndex).getByRole('cell');
  }

  get dropdownCommodityType(): Locator {
    return this.page.getByRole('combobox');
  }

  get dropdownCommodityTypeOptions(): Locator {
    return this.dropdownCommodityType.locator('option');
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  checkboxSpecies(value: CommoditySpecies): Locator {
    return this.page.getByRole('checkbox', { name: value });
  }
}
