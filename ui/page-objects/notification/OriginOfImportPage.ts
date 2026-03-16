import { Page, Locator } from '@playwright/test';

export class OriginOfImportPage {
  readonly expectedUrl = '/origin';
  readonly expectedHeading = 'Origin of the import';

  constructor(private readonly page: Page) {}

  get headingPage(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }
}
