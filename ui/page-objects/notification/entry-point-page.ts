import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';
import type { DateInput } from '@domain/types/date-time-input';

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

  async fillArrivalDate(date: DateInput): Promise<void> {
    await this.inputDay.fill(date.day);
    await this.inputMonth.fill(date.month);
    await this.inputYear.fill(date.year);
  }
}
