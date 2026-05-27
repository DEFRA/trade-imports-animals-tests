import { test, expect } from '@fixtures';
import { createPageObjects } from '@page-objects';
import { Journeys, JourneyContext, EAR_TAG_PREFIX, CONSIGNOR_NAME, DESTINATION_NAME, CPH_NUMBER, TRANSPORTER_NAME } from '@flows/journeys';

test.describe('Notification view', () => {
  let referenceNumber: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const pages = createPageObjects(page);
    const journeyContext: JourneyContext = {};
    const journeys = new Journeys(pages, journeyContext);
    await journeys.submitNotification();
    referenceNumber = journeyContext.notificationId;
    await context.close();
  });

  test.beforeEach(async ({ journeys }) => {
    await journeys.toNotificationView(referenceNumber);
  });

  test('lands on the notification view page', async ({ pages }) => {
    await expect(pages.page).toHaveURL(new RegExp(pages.notificationView.expectedUrl(referenceNumber)));
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.notificationView.referenceNumberCaption).toContainText(referenceNumber);
  });

  test('displays date created', async ({ pages }) => {
    await expect(pages.notificationView.dateCreated).toContainText(/\d{1,2} \w+ \d{4}/);
  });

  test('has a back link to the dashboard', async ({ pages }) => {
    await expect(pages.notificationView.backLink).toBeVisible();
    await expect(pages.notificationView.backLink).toHaveAttribute('href', '/');
  });

  test('displays all section headings', async ({ pages }) => {
    await expect(pages.notificationView.sectionHeading('Where is this consignment coming from?')).toBeVisible();
    await expect(pages.notificationView.sectionHeading('Your commodities')).toBeVisible();
    await expect(pages.notificationView.sectionHeading('Additional information details')).toBeVisible();
    await expect(pages.notificationView.sectionHeading('Reason for importing the animals')).toBeVisible();
    await expect(pages.notificationView.sectionHeading('Addresses')).toBeVisible();
    await expect(pages.notificationView.sectionHeading('County Parish Holding number (CPH)')).toBeVisible();
    await expect(pages.notificationView.sectionHeading('Transport details')).toBeVisible();
    await expect(pages.notificationView.sectionHeading('Accompanying documents')).toBeVisible();
  });

  test('shows origin details', async ({ pages }) => {
    await expect(pages.notificationView.summaryValue('Country of origin')).toHaveText('FR');
  });

  test('shows commodity name', async ({ pages }) => {
    await expect(pages.notificationView.commodityName).toContainText(/dog/i);
  });

  test('shows species rows with ear tag', async ({ pages }) => {
    await expect(pages.notificationView.speciesRows).not.toHaveCount(0);
    await expect(pages.notificationView.speciesCell(0, 1)).toContainText(EAR_TAG_PREFIX);
  });

  test('shows reason for import', async ({ pages }) => {
    await expect(pages.notificationView.summaryValue('Main reason for importing the animals')).toHaveText('Internal market');
  });

  test('shows consignor in addresses section', async ({ pages }) => {
    await expect(pages.notificationView.summaryValue('Consignor')).toContainText(CONSIGNOR_NAME);
  });

  test('shows place of destination in addresses section', async ({ pages }) => {
    await expect(pages.notificationView.summaryValue('Place of destination')).toContainText(DESTINATION_NAME);
  });

  test('shows CPH number', async ({ pages }) => {
    await expect(pages.notificationView.summaryValue('County Parish Holding number (CPH)')).toHaveText(CPH_NUMBER);
  });

  test('shows transporter name', async ({ pages }) => {
    await expect(pages.notificationView.summaryValue('Transporter name')).toContainText(TRANSPORTER_NAME);
  });

  test('shows port of entry', async ({ pages }) => {
    await expect(pages.notificationView.summaryValue('Port of entry')).not.toBeEmpty();
  });

  test('shows no accompanying documents', async ({ pages }) => {
    await expect(pages.notificationView.noDocumentsText).toBeVisible();
  });
});
