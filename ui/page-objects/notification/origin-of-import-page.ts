import { Page, Locator } from '@playwright/test';
import type { YesNoValue } from '@domain/types/yes-no-values';
import { SignInPage } from '@page-objects/auth/sign-in-page';

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

  get groupRequiresOriginCode(): Locator {
    return this.page.getByRole('group', { name: 'Does the consignment require a region of origin code?' });
  }

  radioRequiresOriginCode(value: YesNoValue): Locator {
    return this.groupRequiresOriginCode.getByRole('radio', { name: value });
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

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.page.goto(this.expectedUrl);

    if (attemptSignIn) {
      const signInPage = new SignInPage(this.page);
      await signInPage.signIn();
    }
  }
}
