import { test, expect } from '@fixtures';
import { COUNTRY_OF_ORIGIN, CONSIGNOR_NAME, DESTINATION_NAME, CPH_NUMBER } from '@flows/journeys';

const NOT_PROVIDED = 'Not provided';

test.describe('Notification copy', () => {
  test(
    'copies notification from the view screen and redirects to the new draft',
    { tag: ['@integration'] },
    async ({ pages, journeys, journeyContext }) => {
      await journeys.submitNotification();
      const originalRef = journeyContext.notificationId;

      await journeys.toNotificationView(originalRef);
      await pages.notificationView.btnCopyAsNew.click();

      await pages.notificationView.heading.waitFor();
      await expect(pages.page).toHaveURL(/\/notification-view\//);
      await expect(pages.notificationView.referenceNumberCaption).not.toContainText(originalRef);

      // Retained fields (AC3)
      await expect(pages.notificationView.summaryValue('Country of origin')).toHaveText(COUNTRY_OF_ORIGIN);
      await expect(pages.notificationView.summaryValue('Consignor')).toContainText(CONSIGNOR_NAME);
      await expect(pages.notificationView.summaryValue('Place of destination')).toContainText(DESTINATION_NAME);
      await expect(pages.notificationView.summaryValue('County Parish Holding number (CPH)')).toHaveText(CPH_NUMBER);
      await expect(pages.notificationView.commodityName).not.toHaveText(NOT_PROVIDED);
      await expect(pages.notificationView.summaryValue('Main reason for importing the animals')).not.toHaveText(NOT_PROVIDED);
      await expect(pages.notificationView.summaryValue('Certified for')).not.toHaveText(NOT_PROVIDED);

      // Reset fields (AC3)
      await expect(pages.notificationView.speciesRows).toHaveCount(0);
      await expect(pages.notificationView.summaryValue('Your internal reference number')).toHaveText(NOT_PROVIDED);
      await expect(pages.notificationView.summaryValue('Unweaned animals')).toHaveText(NOT_PROVIDED);
      await expect(pages.notificationView.summaryValue('Transporter name')).toHaveText(NOT_PROVIDED);
      await expect(pages.notificationView.summaryValue('Port of entry')).toHaveText(NOT_PROVIDED);
      await expect(pages.notificationView.summaryValue('Arrival date at destination')).toHaveText(NOT_PROVIDED);
      await expect(pages.notificationView.summaryValue('Contact details for consignment')).toHaveText(NOT_PROVIDED);
    },
  );

  test(
    'copies notification from the dashboard and redirects to the new draft',
    { tag: ['@integration'] },
    async ({ pages, journeys, journeyContext }) => {
      await journeys.submitNotification();
      const originalRef = journeyContext.notificationId;

      await journeys.toNotificationDashboard();
      await pages.notificationDashboard.copyAsNewButton(originalRef).click();

      await pages.notificationView.heading.waitFor();
      await expect(pages.page).toHaveURL(/\/notification-view\//);
      await expect(pages.notificationView.referenceNumberCaption).not.toContainText(originalRef);

      // Retained fields (AC3)
      await expect(pages.notificationView.summaryValue('Country of origin')).toHaveText(COUNTRY_OF_ORIGIN);
      await expect(pages.notificationView.summaryValue('Consignor')).toContainText(CONSIGNOR_NAME);
      await expect(pages.notificationView.summaryValue('Place of destination')).toContainText(DESTINATION_NAME);
      await expect(pages.notificationView.summaryValue('County Parish Holding number (CPH)')).toHaveText(CPH_NUMBER);
      await expect(pages.notificationView.commodityName).not.toHaveText(NOT_PROVIDED);
      await expect(pages.notificationView.summaryValue('Main reason for importing the animals')).not.toHaveText(NOT_PROVIDED);
      await expect(pages.notificationView.summaryValue('Certified for')).not.toHaveText(NOT_PROVIDED);

      // Reset fields (AC3)
      await expect(pages.notificationView.speciesRows).toHaveCount(0);
      await expect(pages.notificationView.summaryValue('Your internal reference number')).toHaveText(NOT_PROVIDED);
      await expect(pages.notificationView.summaryValue('Unweaned animals')).toHaveText(NOT_PROVIDED);
      await expect(pages.notificationView.summaryValue('Transporter name')).toHaveText(NOT_PROVIDED);
      await expect(pages.notificationView.summaryValue('Port of entry')).toHaveText(NOT_PROVIDED);
      await expect(pages.notificationView.summaryValue('Arrival date at destination')).toHaveText(NOT_PROVIDED);
      await expect(pages.notificationView.summaryValue('Contact details for consignment')).toHaveText(NOT_PROVIDED);
    },
  );
});
