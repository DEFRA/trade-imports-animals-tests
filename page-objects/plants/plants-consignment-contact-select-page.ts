import { type Locator } from '@playwright/test';
import { PlantsNotificationPage } from '@page-objects/plants/plants-notification-page';

export class PlantsConsignmentContactSelectPage extends PlantsNotificationPage {
  constructor(page: ConstructorParameters<typeof PlantsNotificationPage>[0]) {
    super(page, 'consignment/contact/select');
  }
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Contact address for consignment', exact: true });
  }
  address(name: string): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }
  get addresses(): Locator {
    return this.page.getByRole('radio');
  }
  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue', exact: true });
  }
  get btnSaveAndReturn(): Locator {
    return this.page.getByRole('button', { name: 'Save and return to overview', exact: true });
  }
}
