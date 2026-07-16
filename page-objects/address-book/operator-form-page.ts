import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export type OperatorFormValues = {
  name?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  county?: string;
  postcode?: string;
  country?: string;
  telephone?: string;
  email?: string;
  approvalNumber?: string;
  transporterCategory?: 'PRIVATE' | 'COMMERCIAL';
};

/**
 * Shared add/edit operator details form — GET+POST /address-book/add/details and
 * /address-book/{operatorId}/edit render identical field markup, only the h1 differs.
 */
export class OperatorFormPage extends BasePage {
  get headingAddDetails(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Add address details' });
  }

  get headingEditDetails(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Edit address details' });
  }

  get sectionAddressDetails(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'Enter address details' });
  }

  get sectionContactDetails(): Locator {
    return this.page.getByRole('heading', { level: 2, name: 'Enter contact details' });
  }

  get inputName(): Locator {
    return this.page.getByLabel('Name');
  }

  get inputAddressLine1(): Locator {
    return this.page.getByLabel('Address line 1');
  }

  get inputAddressLine2(): Locator {
    return this.page.getByLabel('Address line 2 (optional)');
  }

  get inputCity(): Locator {
    return this.page.getByLabel('Town or city');
  }

  get inputCounty(): Locator {
    return this.page.getByLabel('County (optional)');
  }

  get inputPostcode(): Locator {
    return this.page.getByLabel('Postcode');
  }

  get dropdownCountry(): Locator {
    return this.page.getByLabel('Country');
  }

  get inputTelephone(): Locator {
    return this.page.getByLabel('Telephone number');
  }

  get inputEmail(): Locator {
    return this.page.getByLabel('Email address');
  }

  // c-019 conditional TRANSPORTER-only fields.
  get inputApprovalNumber(): Locator {
    return this.page.getByLabel('Approval number (optional)');
  }

  get transporterCategoryGroup(): Locator {
    return this.page.getByRole('group', { name: 'Transporter category (optional)' });
  }

  radioTransporterCategory(value: 'PRIVATE' | 'COMMERCIAL'): Locator {
    return this.page.locator(`input[name="transporterCategory"][value="${value}"]`);
  }

  get btnSaveChanges(): Locator {
    return this.page.getByRole('button', { name: 'Save changes' });
  }

  get btnCancel(): Locator {
    return this.page.getByRole('button', { name: 'Cancel' });
  }

  get errorSummary(): Locator {
    return this.page.locator('.govuk-error-summary');
  }

  errorSummaryLink(text: string): Locator {
    return this.errorSummary.getByRole('link', { name: text });
  }

  async fill(values: OperatorFormValues): Promise<void> {
    if (values.name !== undefined) await this.inputName.fill(values.name);
    if (values.addressLine1 !== undefined) await this.inputAddressLine1.fill(values.addressLine1);
    if (values.addressLine2 !== undefined) await this.inputAddressLine2.fill(values.addressLine2);
    if (values.city !== undefined) await this.inputCity.fill(values.city);
    if (values.county !== undefined) await this.inputCounty.fill(values.county);
    if (values.postcode !== undefined) await this.inputPostcode.fill(values.postcode);
    if (values.country !== undefined) await this.dropdownCountry.selectOption(values.country);
    if (values.telephone !== undefined) await this.inputTelephone.fill(values.telephone);
    if (values.email !== undefined) await this.inputEmail.fill(values.email);
    if (values.approvalNumber !== undefined) await this.inputApprovalNumber.fill(values.approvalNumber);
    if (values.transporterCategory !== undefined) {
      await this.radioTransporterCategory(values.transporterCategory).check();
    }
  }
}
