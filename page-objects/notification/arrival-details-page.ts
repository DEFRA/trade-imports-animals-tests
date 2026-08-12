import { type Locator } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class ArrivalDetailsPage extends NotificationPage {
  constructor(page: ConstructorParameters<typeof NotificationPage>[0]) {
    super(page, 'port-of-entry');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Arrival details' });
  }

  get portOfEntry(): Locator {
    return this.page.locator('select#portOfEntry');
  }

  async selectPort(name: string): Promise<void> {
    await this.portOfEntry.selectOption({ label: name });
  }

  get meansOfTransport(): Locator {
    return this.page.getByRole('group', { name: 'Means of transport' });
  }

  get transportIdentification(): Locator {
    return this.page.getByLabel('Transport identification');
  }

  get transportDocumentReference(): Locator {
    return this.page.getByLabel('Transport document reference');
  }

  get arrivalDate(): Locator {
    return this.page.locator('input[name="arrivalDateAtPort"]');
  }

  get arrivalDateError(): Locator {
    return this.page.locator('#arrivalDateAtPort-error');
  }

  get datePicker(): Locator {
    return this.page.locator('.moj-datepicker');
  }

  async fillArrivalDate(date: string): Promise<void> {
    await this.arrivalDate.fill(date);
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
