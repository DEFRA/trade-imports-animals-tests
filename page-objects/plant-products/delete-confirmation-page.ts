import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class PlantDeleteConfirmationPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'delete', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Confirm you want to delete this notification' });
  }

  get body(): Locator {
    return this.page.getByText('You will not be able to undo this action.', { exact: true });
  }

  get confirm(): Locator {
    return this.page.getByRole('button', { name: 'Delete notification', exact: true });
  }

  get reject(): Locator {
    return this.page.getByRole('button', { name: 'Do not delete notification', exact: true });
  }
}
