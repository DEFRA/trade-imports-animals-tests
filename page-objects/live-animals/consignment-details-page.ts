import { type Locator } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class ConsignmentDetailsPage extends NotificationPage {
  constructor(page: ConstructorParameters<typeof NotificationPage>[0]) {
    super(page, 'consignment-details');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Consignment details' });
  }

  get numberOfAnimals(): Locator {
    return this.page.getByLabel('Number of animals');
  }

  get numberOfPackages(): Locator {
    return this.page.getByLabel('Number of packages (optional)');
  }

  get saveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }
}
