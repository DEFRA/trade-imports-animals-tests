import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class PlantCancelAmendPage extends NotificationPage {
  constructor(page: Page) {
    super(page, 'cancel-amend', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Cancel this amendment?' });
  }

  get body(): Locator {
    return this.page.getByText('Your changes since you started amending will be discarded and the submitted version restored.', {
      exact: true,
    });
  }

  get confirm(): Locator {
    return this.page.getByRole('button', { name: 'Yes, cancel amendment', exact: true });
  }

  get reject(): Locator {
    return this.page.getByRole('button', { name: 'No, return to notification', exact: true });
  }
}
