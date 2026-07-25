import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import type { YesNoValue } from '@domain/constants/yes-no-values';

export class OriginOfImportPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'origin');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Origin of the import' });
  }

  get countryOfOrigin(): Locator {
    return this.page.locator('input#countryOfOrigin');
  }

  async selectCountry(name: string): Promise<void> {
    await this.countryOfOrigin.fill(name);
    await this.page.getByRole('option', { name, exact: true }).click();
  }

  radioRequiresOriginCode(value: YesNoValue): Locator {
    return this.page.getByRole('radio', { name: value, exact: true });
  }

  get regionCode(): Locator {
    return this.page.getByLabel('Region of origin code', { exact: true });
  }

  get internalReference(): Locator {
    return this.page.getByLabel('Your internal reference for this consignment (optional)');
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
