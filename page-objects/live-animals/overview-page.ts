import { type Locator } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';

export class OverviewPage extends NotificationPage {
  constructor(page: ConstructorParameters<typeof NotificationPage>[0]) {
    super(page, '');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Overview' });
  }

  get journeyStrip(): Locator {
    return this.page.locator('.app-journey-strip');
  }

  task(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true });
  }
}
