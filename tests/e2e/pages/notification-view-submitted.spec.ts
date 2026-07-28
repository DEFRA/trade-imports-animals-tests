import { test, expect } from '@fixtures';
import {
  defaultJourneyOptions,
  EAR_TAG_PREFIX,
  CONSIGNOR_NAME,
  DESTINATION_NAME,
  CPH_NUMBER,
  TRANSPORTER_NAME,
} from '@domain/constants/journey-options';
import { getRelativeDate, toDisplayDate } from '@utils/date-utils';
import { camelCaseToSentenceCase } from '@utils/string-utils';

test.describe('Notification view (SUBMITTED)', () => {
  const defaults = defaultJourneyOptions;

  test.beforeEach(async ({ apiJourney, notificationActions }) => {
    const created = await apiJourney.createSubmittedNotification();
    await notificationActions.toNotificationView(created.referenceNumber);
  });

  test('lands on the notification view page', async ({ pages, journeyContext }) => {
    const referenceNumber = journeyContext.referenceNumber;
    await expect(pages.page).toHaveURL(new RegExp(pages.notificationView.expectedUrl(referenceNumber)));
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.notificationView.referenceNumberCaption).toContainText(referenceNumber);
  });

  test('displays date created', async ({ pages }) => {
    const expectedDateCreated = toDisplayDate(getRelativeDate());
    await expect(pages.notificationView.dateCreated).toHaveText(`Date created: ${expectedDateCreated}`);
  });

  test('does not show Change links for a SUBMITTED notification', async ({ pages }) => {
    await expect(pages.notificationView.changeLink('Where is this consignment coming from?')).not.toBeVisible();
    await expect(pages.notificationView.changeLink('Your commodities')).not.toBeVisible();
    await expect(pages.notificationView.changeLink('Addresses')).not.toBeVisible();
  });

  test('shows Copy as new button', async ({ pages }) => {
    await expect(pages.notificationView.btnCopyAsNew).toBeVisible();
  });

  test('does not show Confirm and submit button for a SUBMITTED notification', async ({ pages }) => {
    await expect(pages.notificationView.btnConfirmAndSubmit).not.toBeVisible();
  });

  test('shows origin details', async ({ pages }) => {
    await expect(pages.notificationView.summaryValue('Country of origin')).toHaveText(defaults.countryCode.display);
  });

  test('shows commodity name', async ({ pages }) => {
    await expect(pages.notificationView.commodityName).toContainText(defaults.commodityCode);
  });

  test('shows species rows with ear tag', async ({ pages }) => {
    await expect(pages.notificationView.speciesRows).toHaveCount(defaults.species.length);
    await expect(pages.notificationView.speciesCell(0, 0)).toContainText(defaults.species[0]);
    await expect(pages.notificationView.speciesCell(0, 1)).toContainText(EAR_TAG_PREFIX);
    await expect(pages.notificationView.speciesCell(1, 0)).toContainText(defaults.species[1]);
    await expect(pages.notificationView.speciesCell(1, 1)).toContainText(EAR_TAG_PREFIX);
  });

  test('shows reason for import', async ({ pages }) => {
    const expectedImportReason = camelCaseToSentenceCase(defaults.importReason);
    await expect(pages.notificationView.summaryValue('Main reason for importing the animals')).toHaveText(expectedImportReason);
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
    await expect(pages.notificationView.summaryValue('Port of entry')).toContainText(defaults.pointOfEntry.value);
  });

  test('shows no accompanying documents', async ({ pages }) => {
    // TODO: Pending automation of accompanying documents page (upload doc).
    await expect(pages.notificationView.noDocumentsText).toBeVisible();
  });
});
