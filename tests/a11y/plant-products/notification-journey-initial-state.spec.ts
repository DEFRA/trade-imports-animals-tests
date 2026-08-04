import { test, WCAG_STANDARD } from '@fixtures/a11y';
import { commodityCodes } from '@domain/plant-products/constants/commodity-codes';
import { documentTypes } from '@domain/plant-products/constants/document-types';
import { eppoSpecies } from '@domain/plant-products/constants/eppo-species';
import { packageTypes } from '@domain/plant-products/constants/package-types';
import { quantityTypes } from '@domain/plant-products/constants/quantity-types';
import { varieties } from '@domain/plant-products/constants/varieties';

// govuk-frontend's conditional-reveal radios set aria-expanded on the radio input,
// which axe's aria-allowed-attr rule rejects. Keep each upstream exclusion named
// and scoped to the one input that owns the conditional content.
const transportContainerConditionalRadio = '#usesContainers';
const commonTransitConditionalRadio = '#commonTransitConvention';
const deliveryAddressConditionalRadio = '#destinationSameAsConsignee-2';

const apples = commodityCodes.otherApples;
const appleSpecies = eppoSpecies[apples.value][0];
const [mcIntoshRed, spartan] = varieties[apples.value].MABSD;

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ plantProductsJourney: journey }) => {
    await journey.toNotificationDashboard();
  });

  test('each shipped plant notification journey page has no accessibility violations before its answer is given', async ({
    plantProductsJourney: journey,
    plantProductsPages: pages,
    runA11yScan,
  }) => {
    await test.step('Plant notification dashboard', async () => {
      await runA11yScan();
    });

    await test.step('Import type', async () => {
      await pages.plantNotificationDashboard.createNewNotification.click();
      await pages.importType.heading.waitFor();
      await runA11yScan();
      await pages.importType.plants.check();
      await pages.importType.continueButton.click();
    });

    await test.step('Country of origin', async () => {
      await pages.countryOfOrigin.heading.waitFor();
      await runA11yScan();
      await journey.fillCountryOfOrigin();
      await journey.saveCountryOfOrigin();
    });

    await test.step('Origin of import', async () => {
      await pages.originOfImport.heading.waitFor();
      await runA11yScan();
      await journey.fillOriginOfImport();
      await journey.saveOriginOfImport();
    });

    await test.step('Notification overview', async () => {
      await pages.hub.heading.waitFor();
      // The current frontend ships groups 1–10 and 12; there is no number-11
      // Billing route or page object to scan. This test covers every shipped group.
      await runA11yScan();
    });

    await test.step('Purpose', async () => {
      await pages.hub.task('Purpose').click();
      await pages.aboutTheConsignment.heading.waitFor();
      await runA11yScan();
      await journey.fillPurpose();
      await journey.savePurpose();
    });

    await test.step('Commodity input method', async () => {
      await pages.hub.task('Commodity').click();
      await pages.commodityInputMethod.heading.waitFor();
      await runA11yScan();
      await pages.commodityInputMethod.method('Manual entry').check();
      await pages.commodityInputMethod.saveAndContinue.click();
    });

    await test.step('Commodity search', async () => {
      await pages.commoditySearch.heading.waitFor();
      await runA11yScan();
      await pages.commoditySearch.search(apples.value);
    });

    await test.step('Commodity basic description', async () => {
      await pages.commodityBasicDescription.heading.waitFor();
      await runA11yScan();
      await pages.commodityBasicDescription.addSpecies(apples.value, appleSpecies.genusAndSpecies).click();
      await pages.commodityBasicDescription.saveAndContinue.click();
    });

    await test.step('Variety and class', async () => {
      const target = { lineIndex: 0, speciesIndex: 0, ...appleSpecies };
      await pages.varietyOfGenusAndSpecies.heading.waitFor();
      await runA11yScan();
      await pages.varietyOfGenusAndSpecies.variety(target).selectOption(mcIntoshRed.value);
      await pages.varietyOfGenusAndSpecies.varietyClass(target).selectOption('CLASS_I');
      await pages.varietyOfGenusAndSpecies.addAnother(target).click();
      await pages.varietyOfGenusAndSpecies.variety(target).selectOption(spartan.value);
      await pages.varietyOfGenusAndSpecies.varietyClass(target).selectOption('CLASS_II');
      await pages.varietyOfGenusAndSpecies.addAnother(target).click();
      await pages.varietyOfGenusAndSpecies.saveAndContinue.click();
    });

    await test.step('Commodity summary', async () => {
      await pages.commoditySummary.heading.waitFor();
      await runA11yScan();
      await pages.commoditySummary.saveAndContinue.click();
    });

    await test.step('Commodity bulk details', async () => {
      await pages.commodityBulkDetails.heading.waitFor();
      await runA11yScan();
      await pages.commodityBulkDetails.fill(apples.value, apples.display, {
        numberOfPackages: '4',
        packageType: packageTypes.box.value,
        quantity: '120',
        quantityType: quantityTypes.pieces.value,
        netWeight: '80',
        controlledAtmosphereContainer: false,
        intendedForFinalUsers: true,
        testAndTrial: false,
      });
      await pages.commodityBulkDetails.saveAndContinue.click();
    });

    await test.step('Additional details', async () => {
      await pages.hub.task('Additional details').click();
      await pages.commodityAdditionalDetails.heading.waitFor();
      await runA11yScan();
      await pages.commodityAdditionalDetails.totalGrossWeight.fill('100');
      await pages.commodityAdditionalDetails.saveAndContinue.click();
    });

    await test.step('Transport to the BCP', async () => {
      await pages.hub.task('Transport to the BCP').click();
      await pages.transportBeforeBip.heading.waitFor();
      await runA11yScan({ exclude: transportContainerConditionalRadio });
      await journey.fillTransport();
      await journey.saveTransport();
    });

    await test.step('Goods movement services', async () => {
      await pages.hub.task('Goods movement services').click();
      await pages.goodsMovementServices.heading.waitFor();
      await runA11yScan({ exclude: commonTransitConditionalRadio });
      await journey.fillGoodsMovement();
      await journey.saveGoodsMovement();
    });

    await test.step('Contact details', async () => {
      await pages.hub.task('Contact details').click();
      await pages.contactDetails.heading.waitFor();
      await runA11yScan();
      await journey.fillContact();
      await journey.saveContact();
    });

    await test.step('Nominated contacts', async () => {
      await pages.hub.task('Nominated contacts').click();
      await pages.nominatedContact.heading.waitFor();
      await runA11yScan();
      await journey.saveNominatedContacts();
    });

    await test.step('Accompanying documents', async () => {
      await pages.hub.task('Accompanying documents').click();
      await pages.accompanyingDocuments.heading.waitFor();
      await runA11yScan();
      await journey.fillDocuments([{ type: documentTypes.phytosanitaryCertificate.value, reference: 'PP-DOC-1', issueDate: '4/12/2025' }]);
      await journey.saveDocuments();
    });

    await test.step('Traders', async () => {
      await pages.hub.task('Traders').click();
      await pages.tradersAddresses.heading.waitFor();
      await runA11yScan({ exclude: deliveryAddressConditionalRadio });
      await pages.tradersAddresses.addConsignor.click();
    });

    await test.step('Add consignor', async () => {
      await pages.consignorCreate.heading.waitFor();
      await runA11yScan();
      await journey.fillConsignor({
        name: 'Consignor plant operator',
        addressLine1: '1 Plant Street',
        addressLine2: 'Botanical Quarter',
        addressLine3: 'Glasshouse Estate',
        city: 'London',
        postcode: 'SW1A 1AA',
        telephone: '+44 7700 900123',
        country: 'GB-ENG',
        email: 'consignor@example.com',
      });
      await pages.consignorCreate.saveAndContinue.click();
    });

    await test.step('Consignor confirmation', async () => {
      await pages.consignorConfirmation.heading.waitFor();
      await runA11yScan();
      await pages.consignorConfirmation.addToNotification.click();
      await pages.tradersAddresses.heading.waitFor();
      await pages.tradersAddresses.destinationSameAsConsignee(true).check();
      await pages.tradersAddresses.saveAndReturnToHub.click();
    });

    await test.step('Review notification', async () => {
      await pages.hub.task('Review and submit').click();
      await pages.reviewNotification.heading.waitFor();
      // Trace finding: the legacy review surface had three different actions all named
      // "Copy". Axe cannot detect that semantic ambiguity. The rebuilt review currently
      // exposes contextual Change links, so this green scan is not evidence against a
      // regression to indistinguishable action names.
      await runA11yScan();
      await pages.reviewNotification.continueButton.click();
    });

    await test.step('Declaration', async () => {
      await pages.declaration.heading.waitFor();
      await runA11yScan();
    });
  });
});
