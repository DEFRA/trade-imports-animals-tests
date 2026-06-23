import { test, expect } from '@fixtures';
import { createPageObjects } from '@page-objects';
import { Journeys, JourneyContext } from '@flows/journeys';
import { PLACE_OF_ORIGIN_NAME, CONSIGNOR_NAME, CONSIGNEE_NAME, IMPORTER_NAME, DESTINATION_NAME, CPH_NUMBER } from '@flows/journeys';

test.describe('All operator addresses', () => {
  let referenceNumber: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const pages = createPageObjects(page);
    const journeyContext: JourneyContext = {};
    const journeys = new Journeys(pages, journeyContext);
    await journeys.toReview();
    referenceNumber = journeyContext.notificationId;
    await context.close();
  });

  test.beforeEach(async ({ journeys }) => {
    await journeys.toNotificationView(referenceNumber);
  });

  test('all six operators appear in the addresses section of the notification view', async ({ pages }) => {
    await expect(pages.notificationView.summaryValue('Place of origin')).toContainText(PLACE_OF_ORIGIN_NAME);
    await expect(pages.notificationView.summaryValue('Consignor')).toContainText(CONSIGNOR_NAME);
    await expect(pages.notificationView.summaryValue('Consignee')).toContainText(CONSIGNEE_NAME);
    await expect(pages.notificationView.summaryValue('Importer')).toContainText(IMPORTER_NAME);
    await expect(pages.notificationView.summaryValue('Place of destination')).toContainText(DESTINATION_NAME);
    await expect(pages.notificationView.summaryValue('County Parish Holding number (CPH)')).toContainText(CPH_NUMBER);
  });

  test('place of origin shows name and country', async ({ pages }) => {
    const value = pages.notificationView.summaryValue('Place of origin');
    await expect(value).toContainText(PLACE_OF_ORIGIN_NAME);
    await expect(value).toContainText('Ireland');
  });

  test('consignor shows name and country', async ({ pages }) => {
    const value = pages.notificationView.summaryValue('Consignor');
    await expect(value).toContainText(CONSIGNOR_NAME);
    await expect(value).toContainText('Switzerland');
  });

  test('consignee shows name and country', async ({ pages }) => {
    const value = pages.notificationView.summaryValue('Consignee');
    await expect(value).toContainText(CONSIGNEE_NAME);
    await expect(value).toContainText('United Kingdom');
  });

  test('importer shows name and country', async ({ pages }) => {
    const value = pages.notificationView.summaryValue('Importer');
    await expect(value).toContainText(IMPORTER_NAME);
    await expect(value).toContainText('United Kingdom');
  });

  test('place of destination shows name and country', async ({ pages }) => {
    const value = pages.notificationView.summaryValue('Place of destination');
    await expect(value).toContainText(DESTINATION_NAME);
    await expect(value).toContainText('United Kingdom');
  });
});
