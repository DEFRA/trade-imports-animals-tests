import { test, expect } from '@fixtures';
import { pointOfEntries } from '@domain/constants/point-of-entries';
import { meansOfTransport } from '@domain/constants/means-of-transport';

test.describe('Arrival details', () => {
  test.beforeEach(async ({ apiJourney, pages }) => {
    const created = await apiJourney.createUpToPage('entryPoint');
    await apiJourney.resumeInUi(created.referenceNumber, pages.entryPoint);
  });

  test('shows system-generated notification id (draft)', async ({ pages, journeyContext }) => {
    const notificationId = await pages.entryPoint.notificationId.textContent();
    expect(notificationId).toMatch(/^GBN-AG-\d{2}-[0-9A-Z]{6}$/);
    expect(journeyContext.notificationId).toBe(notificationId);
  });

  test('can navigate back to addresses', async ({ pages }) => {
    await pages.entryPoint.linkBack.click();
    await expect(pages.page).toHaveURL(pages.addresses.expectedUrl);
    await expect(pages.addresses.heading).toBeVisible();
  });

  test('shows default values on first load', async ({ pages }) => {
    await expect(pages.entryPoint.dropdownPortOfEntry.locator('option:checked')).toHaveText('Select port of entry');
    await expect(pages.entryPoint.inputDay).toHaveValue('');
    await expect(pages.entryPoint.inputMonth).toHaveValue('');
    await expect(pages.entryPoint.inputYear).toHaveValue('');
    await expect(pages.entryPoint.dropdownMeansOfTransport.locator('option:checked')).toHaveText('Select one');
    await expect(pages.entryPoint.inputTransportIdentification).toHaveValue('');
    await expect(pages.entryPoint.inputTransportDocumentReference).toHaveValue('');
  });

  test('shows expected means of transport options', async ({ pages }) => {
    const options = await pages.entryPoint.dropdownMeansOfTransportOptions.allTextContents();
    expect(options[0]).toBe('Select one');
    expect(options.slice(1)).toEqual(Object.values(meansOfTransport).map((option) => option.display));
  });

  test('continues to transporter after saving valid entry', async ({ pages }) => {
    await pages.entryPoint.dropdownPortOfEntry.selectOption(pointOfEntries.aberdeen.code);
    await pages.entryPoint.fillArrivalDate({ day: '27', month: '3', year: '2026' });
    await pages.entryPoint.dropdownMeansOfTransport.selectOption(meansOfTransport.vessel.code);
    await pages.entryPoint.inputTransportIdentification.fill('Vessel Poseidon');
    await pages.entryPoint.inputTransportDocumentReference.fill('BILL-OF-LADING-001');
    await pages.entryPoint.btnSaveAndContinue.click();
    await expect(pages.page).toHaveURL(pages.transporter.expectedUrl);
    await expect(pages.transporter.heading).toBeVisible();
  });

  test.describe('Input validation', { tag: '@validation' }, () => {
    test('shows error when means of transport is not selected', async ({ pages }) => {
      await pages.entryPoint.dropdownPortOfEntry.selectOption(pointOfEntries.aberdeen.code);
      await pages.entryPoint.fillArrivalDate({ day: '27', month: '3', year: '2026' });
      await pages.entryPoint.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.entryPoint.expectedUrl);
      await expect(pages.entryPoint.errorMeansOfTransport).toContainText('Select a means of transport');
      const errorSummaryItems = await pages.entryPoint.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toContain('Select a means of transport');
    });

    // The date-range tests select a means of transport first so only the date error is asserted.
    test('shows error when arrival date day is out of range', async ({ pages }) => {
      await pages.entryPoint.dropdownMeansOfTransport.selectOption(meansOfTransport.vessel.code);
      await pages.entryPoint.fillArrivalDate({ day: '32', month: '1', year: '2026' });
      await pages.entryPoint.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.entryPoint.expectedUrl);
      await expect(pages.entryPoint.errorArrivalDate).toContainText('Enter a valid day');
      const errorSummaryItems = await pages.entryPoint.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(1);
      expect(errorSummaryItems).toContain('Enter a valid day');
    });

    test('shows error when arrival date month is out of range', async ({ pages }) => {
      await pages.entryPoint.dropdownMeansOfTransport.selectOption(meansOfTransport.vessel.code);
      await pages.entryPoint.fillArrivalDate({ day: '1', month: '13', year: '2026' });
      await pages.entryPoint.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.entryPoint.expectedUrl);
      await expect(pages.entryPoint.errorArrivalDate).toContainText('Enter a valid month');
      const errorSummaryItems = await pages.entryPoint.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(1);
      expect(errorSummaryItems).toContain('Enter a valid month');
    });

    test('shows error when arrival date year is out of range (three digits)', async ({ pages }) => {
      await pages.entryPoint.dropdownMeansOfTransport.selectOption(meansOfTransport.vessel.code);
      await pages.entryPoint.fillArrivalDate({ day: '1', month: '1', year: '202' });
      await pages.entryPoint.btnSaveAndContinue.click();
      await expect(pages.page).toHaveURL(pages.entryPoint.expectedUrl);
      await expect(pages.entryPoint.errorArrivalDate).toContainText('Enter a valid year');
      const errorSummaryItems = await pages.entryPoint.errorSummaryItems.allTextContents();
      expect(errorSummaryItems).toHaveLength(1);
      expect(errorSummaryItems).toContain('Enter a valid year');
    });

    test('shows all errors when all arrival date fields are out of range', async ({ pages }) => {
      await pages.entryPoint.dropdownMeansOfTransport.selectOption(meansOfTransport.vessel.code);
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
