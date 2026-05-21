import { test, expect } from '@fixtures';
import { pointOfEntries } from '@domain/constants/point-of-entries';

test.describe('Entry point and arrival at destination', () => {
  test.beforeEach(async ({ journeys }) => {
    await journeys.toEntryPoint();
  });

  test('shows system-generated notification id (draft)', async ({ pages, journeyContext }) => {
    const notificationId = await pages.entryPoint.notificationId.textContent();
    expect(notificationId).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
  });

  test('can navigate back to cph number', async ({ pages }) => {
    await pages.entryPoint.linkBack.click();
    await expect(pages.page).toHaveURL(pages.cphNumber.expectedUrl);
    await expect(pages.cphNumber.heading).toBeVisible();
  });

  test('shows default values on first load', async ({ pages }) => {
    await expect(pages.entryPoint.dropdownPortOfEntry.locator('option:checked')).toHaveText('Select port of entry');
    await expect(pages.entryPoint.inputDay).toHaveValue('');
    await expect(pages.entryPoint.inputMonth).toHaveValue('');
    await expect(pages.entryPoint.inputYear).toHaveValue('');
  });

  test('shows expected points of entries', async ({ pages }) => {
    const options = await pages.entryPoint.dropdownPortOfEntryOptions.allTextContents();
    const expectedOptions = Object.values(pointOfEntries);
    expect(options[0]).toBe('Select port of entry');
    expect(options[1]).toBe('──────────');
    // Dropdown options must match the expected list in the correct order (alphabetical).
    expect(options.slice(2)).toEqual(expectedOptions);
  });

  test('continues to transporter after saving valid entry', async ({ pages }) => {
    await pages.entryPoint.dropdownPortOfEntry.selectOption('ABERDEEN');
    await pages.entryPoint.fillArrivalDate({ day: '27', month: '3', year: '2026' });
    await pages.entryPoint.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.transporter.expectedUrl);
    await expect(pages.transporter.heading).toBeVisible();
  });

  // Basic date format/min-max validation (not in the original ACs) ensures a valid backend payload; extend coverage later.
  test.describe('Input validation', { tag: '@validation' }, () => {
    test('shows error when arrival date day is out of range', async ({ pages }) => {
      await pages.entryPoint.fillArrivalDate({ day: '32', month: '1', year: '2026' });
      await pages.entryPoint.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.entryPoint.expectedUrl);
      await expect(pages.entryPoint.errorArrivalDate).toContainText('Enter a valid day');
      const errorSummaryItems = await pages.entryPoint.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(1);
      expect(errorSummaryItems).toContain('Enter a valid day');
    });

    test('shows error when arrival date month is out of range', async ({ pages }) => {
      await pages.entryPoint.fillArrivalDate({ day: '1', month: '13', year: '2026' });
      await pages.entryPoint.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.entryPoint.expectedUrl);
      await expect(pages.entryPoint.errorArrivalDate).toContainText('Enter a valid month');
      const errorSummaryItems = await pages.entryPoint.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(1);
      expect(errorSummaryItems).toContain('Enter a valid month');
    });

    test('shows error when arrival date year is out of range (three digits)', async ({ pages }) => {
      await pages.entryPoint.fillArrivalDate({ day: '1', month: '1', year: '202' });
      await pages.entryPoint.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.entryPoint.expectedUrl);
      await expect(pages.entryPoint.errorArrivalDate).toContainText('Enter a valid year');
      const errorSummaryItems = await pages.entryPoint.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(1);
      expect(errorSummaryItems).toContain('Enter a valid year');
    });

    test('shows all errors when all arrival date fields are out of range', async ({ pages }) => {
      await pages.entryPoint.fillArrivalDate({ day: '0', month: '13', year: '20266' });
      await pages.entryPoint.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.entryPoint.expectedUrl);
      await expect(pages.entryPoint.errorArrivalDate).toContainText('Enter a valid day');
      const errorSummaryItems = await pages.entryPoint.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(3);
      expect(errorSummaryItems).toContain('Enter a valid day');
      expect(errorSummaryItems).toContain('Enter a valid month');
      expect(errorSummaryItems).toContain('Enter a valid year');
    });
  });
});
