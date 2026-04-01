import { Page, Locator } from '@playwright/test';

export class SignOutPage {
  readonly expectedUrl = new RegExp('/idphub/b2c/b2c_1a_cui_cpdev_signupsigninsfi/signout$');
  readonly expectedHeading = 'You have signed out';

  constructor(private readonly page: Page) {}

  get headingPage(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }
}
