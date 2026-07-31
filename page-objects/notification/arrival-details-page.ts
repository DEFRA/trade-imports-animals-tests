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
    return this.page.locator('input#portOfEntry');
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

  async fillArrivalDate(date: string): Promise<void> {
    await this.page.locator('input[name="arrivalDateAtPort"]').fill(date);
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
