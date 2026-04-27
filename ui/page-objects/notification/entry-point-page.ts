import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class EntryPointPage extends BasePage {
  readonly expectedUrl = '/port-of-entry';

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'DRAFT' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Entry point and arrival at destination' });
  }

  get dropdownPortOfEntry(): Locator {
    return this.page.getByRole('combobox', { name: 'What is the port of entry into Great Britain?' });
  }

  get dropdownPortOfEntryOptions(): Locator {
    return this.dropdownPortOfEntry.locator('option');
  }

  get inputDay(): Locator {
    return this.page.getByRole('textbox', { name: 'Day' });
  }

  get inputMonth(): Locator {
    return this.page.getByRole('textbox', { name: 'Month' });
  }

  get inputYear(): Locator {
    return this.page.getByRole('textbox', { name: 'Year' });
  }

  get errorSummaryItems(): Locator {
    return this.page
      .getByRole('alert')
      .filter({ has: this.page.getByRole('heading', { name: 'There is a problem' }) })
      .getByRole('link');
  }

  get errorArrivalDate(): Locator {
    return this.page.locator('#arrivalDate-error');
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  async fillArrivalDate(day: string, month: string, year: string): Promise<void> {
    await this.inputDay.fill(day);
    await this.inputMonth.fill(month);
    await this.inputYear.fill(year);
  }
}
