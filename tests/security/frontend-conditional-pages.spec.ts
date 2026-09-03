import { test, expect } from '@fixtures';
import { getRelativeAppDateText } from '@utils/date-utils';

const PRIVATE_TRANSPORTER = {
  name: 'Jean Dupont',
  addressLine1: '12 Rue des Fermes',
  townOrCity: 'Amiens',
  postalOrZipCode: '80000',
  country: 'France',
  telephoneNumber: '+33 3 22 55 01 44',
  emailAddress: 'jean.dupont@example.fr',
};

test.describe('Security scan (frontend, conditional pages)', { tag: '@active' }, () => {
  test('routes the reason-gated and transporter-gated pages through the ZAP proxy', async ({ journey, pages }) => {
    test.slow();
    // Three pages the submission journey never sees, because its answers put
    // them out of scope. Two reasons are needed, not one: transit brings the
    // destination country and port of exit into scope, and the temporary
    // admission of horses brings the port of exit and the exit date.
    await journey.startNotification();
    await journey.unlockSections();

    await pages.overview.task('Main reason for importing').click();
    await pages.importReason.reason('Transit').check();
    await pages.importReason.saveAndContinue.click();

    await expect(pages.destinationCountry.heading).toBeVisible();
    await pages.destinationCountry.country.selectOption('FR');
    await pages.destinationCountry.saveAndContinue.click();

    await expect(pages.portOfExit.heading).toBeVisible();
    await pages.portOfExit.port.selectOption({ index: 2 });
    await pages.portOfExit.saveAndContinue.click();
    await pages.additionalDetails.heading.waitFor();
    await pages.additionalDetails.saveAndContinue.click();
    await pages.overview.heading.waitFor();

    await pages.overview.task('Main reason for importing').click();
    await pages.importReason.reason('Temporary admission horses').check();
    await pages.importReason.saveAndContinue.click();

    await expect(pages.portOfExit.heading).toBeVisible();
    await pages.portOfExit.port.selectOption({ index: 2 });
    await pages.portOfExit.saveAndContinue.click();

    await expect(pages.exitDate.heading).toBeVisible();
    await pages.exitDate.exitDate.fill(getRelativeAppDateText({ monthOffset: 2 }));
    await pages.exitDate.saveAndContinue.click();
    await pages.additionalDetails.heading.waitFor();
    await pages.additionalDetails.saveAndContinue.click();
    await pages.overview.heading.waitFor();

    // The private branch of the transporter question; the submission journey
    // only ever takes the commercial one.
    await journey.reachTransporterFromHub();
    await pages.transporter.transporterType('Private').check();
    await pages.transporter.saveAndContinue.click();

    await expect(pages.privateTransporter.heading).toBeVisible();
    await pages.privateTransporter.fill(PRIVATE_TRANSPORTER);
    await pages.privateTransporter.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();
  });
});
