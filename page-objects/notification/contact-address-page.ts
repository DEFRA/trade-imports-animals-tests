import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class ContactAddressPage extends BasePage {
  readonly expectedUrl = '/consignment/contact/select';

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'GBN-AG' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Contact address for consignment' });
  }

  get paragraphDescription(): Locator {
    return this.page.getByText(
      'This is the contact address of the person responsible for the consignment from when it enters Great Britain until authorities complete their checks.',
    );
  }

  get groupSelectAddress(): Locator {
    return this.page.getByRole('group', { name: 'Select an address' });
  }

  get linkAddNewBranchAddress(): Locator {
    return this.page.getByRole('link', { name: 'add a new branch address' });
  }

  radioAddress(name: string): Locator {
    return this.groupSelectAddress.getByRole('radio', { name: new RegExp(name) });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
