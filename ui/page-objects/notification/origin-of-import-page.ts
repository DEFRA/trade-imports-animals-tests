import { Page, Locator } from '@playwright/test';
import type { YesNoValue } from '@domain/types/yes-no-values';

export class OriginOfImportPage {
  readonly expectedUrl = '/origin';
  readonly expectedHeading = 'Origin of the import';

  constructor(private readonly page: Page) {}

  get headingPage(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get dropdownCountry(): Locator {
    return this.page.getByRole('combobox', { name: 'Origin of the Import' });
  }

  get dropdownCountryOptions(): Locator {
    return this.dropdownCountry.locator('option');
  }

  get inputInternalReferenceNumber(): Locator {
    return this.page.getByRole('textbox', { name: 'Your internal reference number' });
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

  get errorCountry(): Locator {
    return this.page.locator('#countryCode-error');
  }

  get errorInternalReferenceNumber(): Locator {
    return this.page.locator('#internalReference-error');
  }

  radioRequiresOriginCode(value: YesNoValue): Locator {
    return this.page.getByRole('radio', { name: value });
  }
}
