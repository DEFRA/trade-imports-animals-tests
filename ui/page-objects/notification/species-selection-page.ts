import { Page, Locator } from '@playwright/test';
import { CommoditySpecies } from '@domain/types/commodity-species';

export class SpeciesSelectionPage {
  readonly expectedUrl = '/commodities/select';
  readonly expectedHeading = 'Commodity';

  constructor(private readonly page: Page) {}

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'DRAFT' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get headingPage(): Locator {
    return this.page.locator('.govuk-heading-xl');
  }

  get tableCommodities(): Locator {
    return this.page.getByRole('table', { name: 'Commodities' });
  }

  get tableBodyRowsCommodities(): Locator {
    return this.tableCommodities.locator('tbody').getByRole('row');
  }

  tableBodyRowCellsCommodities(index: number): Locator {
    return this.tableBodyRowsCommodities.nth(index).getByRole('cell');
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
