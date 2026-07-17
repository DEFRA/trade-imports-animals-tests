import { Locator } from '@playwright/test';
import { BasePage } from '@page-objects/base/base-page';

export class TransitedCountriesPage extends BasePage {
  readonly expectedUrl = '/transited-countries';

  get notificationId(): Locator {
    return this.page.locator('.govuk-caption-xl', { hasText: 'GBN-AG' });
  }

  get linkBack(): Locator {
    return this.page.getByRole('link', { name: 'Back' });
  }

  get heading(): Locator {
    return this.page.getByRole('heading', {
      level: 1,
      name: 'Which countries will the consignment travel through?',
    });
  }

  get inputCountrySearch(): Locator {
    return this.page.getByRole('searchbox', { name: 'Search for a country' });
  }

  get btnSearch(): Locator {
    return this.page.getByRole('button', { name: 'Search', exact: true });
  }

  get selectedCountriesList(): Locator {
    return this.page.locator('#selected-countries-list');
  }

  checkboxForCountry(countryName: string): Locator {
    return this.page.getByRole('checkbox', { name: countryName });
  }

  get btnAddSelectedCountries(): Locator {
    return this.page.getByRole('button', { name: 'Add selected countries' });
  }

  get btnSaveAndContinue(): Locator {
    return this.page.getByRole('button', { name: 'Save and continue' });
  }

  removeButtonForCountry(countryName: string): Locator {
    return this.selectedCountriesList.getByRole('button', {
      name: `Remove ${countryName}`,
    });
  }

  selectedCountry(countryName: string): Locator {
    return this.selectedCountriesList.locator('.app-selected-countries__item', {
      hasText: countryName,
    });
  }

  /**
   * Server-side search via GET ?q= (works with JS disabled; CI-safe).
   */
  async searchForCountry(query: string): Promise<void> {
    await this.inputCountrySearch.fill(query);
    await Promise.all([
      this.page.waitForURL((url) => {
        const q = url.searchParams.get('q') ?? '';
        return q === query;
      }),
      this.btnSearch.click(),
    ]);
  }
}
