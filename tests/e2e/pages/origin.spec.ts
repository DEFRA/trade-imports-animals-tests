import { test, expect } from '@fixtures';
import { countryCodes } from '@domain/types/country-codes';
import { yesNoValues } from '@domain/types/yes-no-values';
import { camelCaseToTitleCase } from '@utils/string-utils';

test.describe('Origin of the import', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toOriginOfImport();
  });

  test('shows only EU and EFTA countries in origin dropdown', async ({ pages }) => {
    const countryOptions = await pages.originOfImport.dropdownCountryOptions.allTextContents();
    const keys = Object.keys(countryCodes.eu);
    const expectedOptions = keys.map(camelCaseToTitleCase);
    expect(countryOptions[0]).toBe('Select a country');
    expect(countryOptions[1]).toMatch(/^─+$/);
    // Dropdown countries must match the expected list in the correct order (alphabetical).
    expect(countryOptions.slice(2)).toEqual(expectedOptions);
  });

  test('does not show any ROW countries in origin dropdown', async ({ pages }) => {
    const countryOptions = await pages.originOfImport.dropdownCountryOptions.allTextContents();
    const keys = Object.keys(countryCodes.row);
    const rowOptions = keys.map(camelCaseToTitleCase);

    for (const rowOption of rowOptions) {
      expect(countryOptions).not.toContain(rowOption);
    }
  });

  test('defaults country to "Select a country" and region code to "No"', async ({ pages }) => {
    // Default "Select a country" option has an empty value.
    await expect(pages.originOfImport.dropdownCountry.locator('option:checked')).toHaveText('Select a country');
    await expect(pages.originOfImport.dropdownCountry).toHaveValue('');
    await expect(pages.originOfImport.radioRequiresOriginCode(yesNoValues.yes)).not.toBeChecked();
    await expect(pages.originOfImport.radioRequiresOriginCode(yesNoValues.no)).toBeChecked();
  });

  test('allows changing the region code from "No" to "Yes"', async ({ pages }) => {
    await pages.originOfImport.radioRequiresOriginCode(yesNoValues.yes).click();
    await expect(pages.originOfImport.radioRequiresOriginCode(yesNoValues.yes)).toBeChecked();
    await expect(pages.originOfImport.radioRequiresOriginCode(yesNoValues.no)).not.toBeChecked();
  });

  test('continues to commodity selection with defaults and required fields only', async ({ pages }) => {
    await pages.originOfImport.dropdownCountry.selectOption(countryCodes.eu.austria);
    await pages.originOfImport.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.commoditySelection.expectedUrl);
    await expect(pages.commoditySelection.headingPage).toHaveText(pages.commoditySelection.expectedHeading);
  });

  test('continues to commodity selection when all fields are valid', async ({ pages }) => {
    await pages.originOfImport.dropdownCountry.selectOption(countryCodes.eu.sweden);
    await pages.originOfImport.radioRequiresOriginCode(yesNoValues.yes).click();
    await pages.originOfImport.inputInternalReferenceNumber.fill('B'.repeat(58));
    await pages.originOfImport.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.commoditySelection.expectedUrl);
    await expect(pages.commoditySelection.headingPage).toHaveText(pages.commoditySelection.expectedHeading);
  });

  test.describe('Input validation', { tag: '@validation' }, () => {
    test('shows error when country of origin is not selected', async ({ pages }) => {
      // Leave country of origin on default "Select a country".
      await pages.originOfImport.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.originOfImport.expectedUrl);
      const errorInline = pages.originOfImport.errorCountry;
      await expect(errorInline).toContainText('Select the country where the animal originates from');
      const errorSummaryItems = await pages.originOfImport.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toContain('Select the country where the animal originates from');
    });

    test('shows error for non-alphanumeric internal reference', async ({ pages }) => {
      await pages.originOfImport.inputInternalReferenceNumber.fill('ABC123-_$!');
      await pages.originOfImport.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.originOfImport.expectedUrl);
      const errorInline = pages.originOfImport.errorInternalReferenceNumber;
      await expect(errorInline).toContainText('Internal reference must only contain letters and numbers');
      const errorSummaryItems = await pages.originOfImport.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toContain('Internal reference must only contain letters and numbers');
    });

    test('shows error when internal reference exceeds 58 characters', async ({ pages }) => {
      const fiftyNineChars = 'A'.repeat(59);
      await pages.originOfImport.inputInternalReferenceNumber.fill(fiftyNineChars);
      await pages.originOfImport.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.originOfImport.expectedUrl);
      const errorInline = pages.originOfImport.errorInternalReferenceNumber;
      await expect(errorInline).toContainText('Internal reference must be 58 characters or less');
      const errorSummaryItems = await pages.originOfImport.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toContain('Internal reference must be 58 characters or less');
    });

    test('shows both errors when internal reference is too long and non-alphanumeric', async ({ pages }) => {
      const invalidValue = 'A'.repeat(58) + '-$';
      await pages.originOfImport.inputInternalReferenceNumber.fill(invalidValue);
      await pages.originOfImport.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.originOfImport.expectedUrl);
      const errorInline = pages.originOfImport.errorInternalReferenceNumber;
      await expect(errorInline).toContainText('Internal reference must be 58 characters or less');
      const errorSummaryItems = await pages.originOfImport.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toContain('Internal reference must only contain letters and numbers');
      expect(errorSummaryItems).toContain('Internal reference must be 58 characters or less');
    });
  });
});
