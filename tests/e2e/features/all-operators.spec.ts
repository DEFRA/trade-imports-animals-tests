import { test, expect } from '@fixtures';
import {
  PLACE_OF_ORIGIN_NAME,
  CONSIGNOR_NAME,
  CONSIGNEE_NAME,
  IMPORTER_NAME,
  DESTINATION_NAME,
  CPH_NUMBER,
} from '@domain/constants/journey-options';

test.describe('All operator addresses', () => {
  test.beforeEach(async ({ apiJourney, notificationActions }) => {
    const created = await apiJourney.createFullNotification();
    await notificationActions.toNotificationView(created.referenceNumber);
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
    await expect(value).toContainText('Germany');
  });

  test('consignor shows name and country', async ({ pages }) => {
    const value = pages.notificationView.summaryValue('Consignor');
    await expect(value).toContainText(CONSIGNOR_NAME);
    await expect(value).toContainText('Ireland');
  });

  test('consignee shows name and country', async ({ pages }) => {
    const value = pages.notificationView.summaryValue('Consignee');
    await expect(value).toContainText(CONSIGNEE_NAME);
    await expect(value).toContainText('France');
  });

  test('importer shows name and country', async ({ pages }) => {
    const value = pages.notificationView.summaryValue('Importer');
    await expect(value).toContainText(IMPORTER_NAME);
    await expect(value).toContainText('Germany');
  });

  test('place of destination shows name and country', async ({ pages }) => {
    const value = pages.notificationView.summaryValue('Place of destination');
    await expect(value).toContainText(DESTINATION_NAME);
    await expect(value).toContainText('United Kingdom');
  });
});
