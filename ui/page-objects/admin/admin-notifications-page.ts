import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class AdminNotificationsPage extends BasePage {
  readonly expectedUrl = '/notifications';

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Notifications' });
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
    await this.signInWhenRequested(attemptSignIn);
  }

  tableRowByReference(referenceNumber: string): Locator {
    return this.page.getByRole('table').getByRole('row', { name: referenceNumber });
  }

  checkboxNotificationByReference(referenceNumber: string): Locator {
    return this.page.getByRole('checkbox', { name: `Select notification ${referenceNumber}` });
  }
}
