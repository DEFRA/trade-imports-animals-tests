import { Page, Locator } from '@playwright/test';
import { SignInPage } from '@page-objects/auth/sign-in-page';

export class AdminNotificationsPage {
  readonly expectedUrl = '/notifications';
  readonly expectedHeading = 'Notifications';

  constructor(private readonly page: Page) {}

  get headingPage(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  get inputReferenceNumber(): Locator {
    return this.page.getByRole('textbox', { name: 'Reference number' });
  }

  get btnDeleteByReferenceNumber(): Locator {
    return this.page.getByRole('button', { name: 'Delete notification by' });
  }

  get checkBoxSelectAll(): Locator {
    return this.page.getByRole('checkbox', { name: 'Select all notifications', exact: true });
  }

  get tableRows(): Locator {
    return this.page.getByRole('table').getByRole('row');
  }

  get btnDelete(): Locator {
    return this.page.getByRole('button', { name: 'Delete', exact: true });
  }

  get btnConfirm(): Locator {
    return this.page.getByRole('button', { name: 'Confirm' });
  }

  get btnCancel(): Locator {
    return this.page.getByRole('button', { name: 'Cancel' });
  }

  get alertSuccess(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'Success' }) });
  }

  get alertImportant(): Locator {
    return this.page.getByRole('alert').filter({ has: this.page.getByRole('heading', { name: 'Important' }) });
  }

  async open(attemptSignIn: boolean = true): Promise<void> {
    await this.page.goto(this.expectedUrl);

    if (attemptSignIn) {
      const signInPage = new SignInPage(this.page);
      await signInPage.signIn();
    }
  }

  tableRowByReference(referenceNumber: string): Locator {
    return this.page.getByRole('table').getByRole('row', { name: referenceNumber });
  }

  checkboxNotificationByReference(referenceNumber: string): Locator {
    return this.page.getByRole('checkbox', { name: `Select notification ${referenceNumber}` });
  }
}
