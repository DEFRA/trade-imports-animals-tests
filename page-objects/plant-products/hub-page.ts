import { type Locator, type Page } from '@playwright/test';
import { NotificationPage } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

export class PlantHubPage extends NotificationPage {
  constructor(page: Page) {
    super(page, '', SET_BASES.plantProducts);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Notification overview' });
  }

  task(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true });
  }

  taskRow(name: string): Locator {
    return this.page.getByRole('listitem').filter({ has: this.page.getByText(name, { exact: true }) });
  }

  rowStatus(name: string): Locator {
    return this.taskRow(name).locator('.govuk-task-list__status');
  }

  get groupHeadings(): Locator {
    return this.page.getByRole('heading', { level: 2 });
  }
}
