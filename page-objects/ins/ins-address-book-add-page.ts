import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export type NewAddressDetails = {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  townOrCity: string;
  county?: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
};

export class InsAddressBookAddPage extends BasePage {
  readonly expectedUrl = '/address-book/add';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add address details' });
  }

  get inputName(): Locator {
    return this.page.getByLabel('Name or organisation name');
  }

  get inputAddressLine1(): Locator {
    return this.page.getByLabel('Address line 1');
  }

  get inputAddressLine2(): Locator {
    return this.page.getByLabel('Address line 2 (optional)');
  }

  get inputTownOrCity(): Locator {
    return this.page.getByLabel('Town or city');
  }

  get inputCounty(): Locator {
    return this.page.getByLabel('County (optional)');
  }

  get inputPostcode(): Locator {
    return this.page.getByLabel('Postcode or Zip code');
  }

  get selectCountry(): Locator {
    return this.page.getByLabel('Country');
  }

  get inputEmail(): Locator {
    return this.page.getByLabel('Email address');
  }

  get inputPhone(): Locator {
    return this.page.getByLabel('Phone number');
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  get btnCancel(): Locator {
    return this.page.getByRole('button', { name: 'Cancel and return to address book' });
  }

  get errorSummary(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'There is a problem' });
  }

  async open(attemptSignIn: boolean = true, options?: { userId?: string; organisationSbi?: string }): Promise<void> {
    await this.page.goto(this.expectedUrl);
    await this.signInWhenRequested(attemptSignIn, options);
  }

  async fill(details: NewAddressDetails): Promise<void> {
    await this.inputName.fill(details.name);
    await this.inputAddressLine1.fill(details.addressLine1);
    if (details.addressLine2) {
      await this.inputAddressLine2.fill(details.addressLine2);
    }
    await this.inputTownOrCity.fill(details.townOrCity);
    if (details.county) {
      await this.inputCounty.fill(details.county);
    }
    await this.inputPostcode.fill(details.postcode);
    await this.selectCountry.selectOption(details.country);
    await this.inputEmail.fill(details.email);
    await this.inputPhone.fill(details.phone);
  }

  async save(): Promise<void> {
    await this.btnSaveAndContinue.click();
  }
}
