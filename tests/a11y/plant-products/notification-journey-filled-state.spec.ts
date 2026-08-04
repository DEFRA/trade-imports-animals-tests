import { test, WCAG_STANDARD } from '@fixtures/a11y';
import { commodityCodes } from '@domain/plant-products/constants/commodity-codes';
import { documentTypes } from '@domain/plant-products/constants/document-types';
import { eppoSpecies } from '@domain/plant-products/constants/eppo-species';
import { packageTypes } from '@domain/plant-products/constants/package-types';
import { quantityTypes } from '@domain/plant-products/constants/quantity-types';
import { varieties, varietyClasses } from '@domain/plant-products/constants/varieties';
import type { PlantCommodityLineOptions } from '@flows/plant-products/journey';

// govuk-frontend's conditional-reveal radios set aria-expanded on the radio input,
// which axe's aria-allowed-attr rule rejects. Keep each upstream exclusion named
// and scoped to the one input that owns the conditional content.
const transportContainerConditionalRadio = '#usesContainers';
const commonTransitConditionalRadio = '#commonTransitConvention';
const deliveryAddressConditionalRadio = '#destinationSameAsConsignee-2';

const foliage = commodityCodes.otherFoliage;
const [crataegomespilus, lens] = eppoSpecies[foliage.value];
const apples = commodityCodes.otherApples;
const appleSpecies = eppoSpecies[apples.value][0];
const appleVarieties = varieties[apples.value].MABSD.map(({ value }, index) => ({
  variety: value,
  varietyClass: varietyClasses[apples.value][index].value,
}));

const bulkDetails = {
  numberOfPackages: '4',
  packageType: packageTypes.box.value,
  quantity: '120',
  quantityType: quantityTypes.pieces.value,
  netWeight: '80',
  controlledAtmosphereContainer: false,
  intendedForFinalUsers: true,
  testAndTrial: false,
};

const complexCommodityLines: PlantCommodityLineOptions[] = [
  {
    commodityCode: foliage.value,
    commodityDescription: foliage.display,
    species: [crataegomespilus, lens],
    details: bulkDetails,
  },
  {
    commodityCode: apples.value,
    commodityDescription: apples.display,
    species: [{ ...appleSpecies, varieties: appleVarieties }],
    details: bulkDetails,
  },
];

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test.beforeEach(async ({ plantProductsJourney: journey }) => {
    await journey.startNotification();
  });

  test('each plant notification journey page has no accessibility violations after user input', async ({
    plantProductsJourney: journey,
    plantProductsPages: pages,
    runA11yScan,
  }) => {
    const reference = pages.hub.journeyIdFromUrl();

    await test.step('Origin of import', async () => {
      await journey.answerOrigin({ internalReference: 'PP-API-SEED' });
      await pages.countryOfOrigin.open(reference, false);
      await pages.countryOfOrigin.heading.waitFor();
      await runA11yScan();
      await pages.originOfImport.open(reference, false);
      await pages.originOfImport.heading.waitFor();
      await runA11yScan();
      await pages.hub.open(reference, false);
      await pages.hub.heading.waitFor();
    });

    await test.step('Purpose', async () => {
      await journey.answerPurpose();
      await pages.aboutTheConsignment.open(reference, false);
      await pages.aboutTheConsignment.heading.waitFor();
      await runA11yScan();
      await pages.hub.open(reference, false);
      await pages.hub.heading.waitFor();
    });

    await test.step('Commodity depth-3 summary', async () => {
      await pages.hub.task('Commodity').click();
      await pages.commodityInputMethod.heading.waitFor();
      await pages.commodityInputMethod.method('Manual entry').check();
      await runA11yScan();
      await pages.commodityInputMethod.saveAndContinue.click();

      for (const [lineIndex, line] of complexCommodityLines.entries()) {
        if (lineIndex > 0) {
          await pages.commoditySummary.addAnotherCommodity.click();
        }

        await pages.commoditySearch.heading.waitFor();
        const selectedSpecies = line.species[0];
        await pages.page.getByRole('tab', { name: 'Genus and species search' }).click();
        await pages.page.getByLabel('Enter genus and species').fill(selectedSpecies.genusAndSpecies);
        await pages.page.getByRole('tabpanel', { name: 'Genus and species search' }).getByRole('button', { name: 'Search' }).click();
        const searchResult = pages.page.getByRole('listitem').filter({
          hasText: `${selectedSpecies.genusAndSpecies} — ${line.commodityCode}`,
        });
        await searchResult.waitFor();
        await runA11yScan();
        await searchResult.getByRole('button', { name: 'Add' }).click();

        await pages.commodityBasicDescription.heading.waitFor();
        for (const species of line.species.slice(1)) {
          await pages.commodityBasicDescription.addSpecies(line.commodityCode, species.genusAndSpecies).click();
        }
        await runA11yScan();
        await pages.commodityBasicDescription.saveAndContinue.click();

        const varietyEntries = line.species.flatMap((species, speciesIndex) =>
          (species.varieties ?? []).map((variety) => ({
            target: {
              lineIndex,
              speciesIndex,
              eppoCode: species.eppoCode,
              genusAndSpecies: species.genusAndSpecies,
            },
            variety,
          })),
        );
        if (varietyEntries.length > 0) {
          await pages.varietyOfGenusAndSpecies.heading.waitFor();
          for (const { target, variety } of varietyEntries) {
            await pages.varietyOfGenusAndSpecies.variety(target).selectOption(variety.variety);
            await pages.varietyOfGenusAndSpecies.varietyClass(target).selectOption(variety.varietyClass);
            await pages.varietyOfGenusAndSpecies.addAnother(target).click();
          }
          await runA11yScan();
          await pages.varietyOfGenusAndSpecies.saveAndContinue.click();
        }

        await pages.commoditySummary.heading.waitFor();
      }

      // Two commodity lines, three species and three varieties deliberately
      // exercise the deepest nested commodity summary rendered by this set.
      await runA11yScan();
      await pages.commoditySummary.saveAndContinue.click();

      await pages.commodityBulkDetails.heading.waitFor();
      for (const line of complexCommodityLines) {
        if (!line.details) throw new Error(`Commodity ${line.commodityCode} is missing bulk details`);
        await pages.commodityBulkDetails.fill(line.commodityCode, line.commodityDescription, line.details);
      }
      await runA11yScan();
      await pages.commodityBulkDetails.saveAndContinue.click();
      await pages.hub.heading.waitFor();
    });

    await test.step('Additional details', async () => {
      await journey.answerAdditionalDetails({ totalGrossWeight: '250', grossVolume: '250', grossVolumeUnit: 'LITRES' });
      await pages.commodityAdditionalDetails.open(reference, false);
      await pages.commodityAdditionalDetails.heading.waitFor();
      await runA11yScan();
      await pages.hub.open(reference, false);
      await pages.hub.heading.waitFor();
    });

    await test.step('Transport with revealed container fields', async () => {
      await journey.answerTransport();
      await pages.transportBeforeBip.open(reference, false);
      await pages.transportBeforeBip.heading.waitFor();
      await pages.transportBeforeBip.usesContainers(true).check();
      // Adding a container to a UI-created journey currently returns a frontend
      // 500. Scan the revealed conditional fields without masking that defect.
      await runA11yScan({ exclude: transportContainerConditionalRadio });
      await pages.hub.open(reference, false);
      await pages.hub.heading.waitFor();
    });

    await test.step('Goods movement with revealed MRN field', async () => {
      await journey.answerGoodsMovement({
        commonTransitConvention: 'ADD_MRN_NOW',
        movementReferenceNumber: '24GB123456789AB012',
        usingGvms: true,
      });
      await pages.goodsMovementServices.open(reference, false);
      await pages.goodsMovementServices.heading.waitFor();
      await runA11yScan({ exclude: commonTransitConditionalRadio });
      await pages.hub.open(reference, false);
      await pages.hub.heading.waitFor();
    });

    await test.step('Contact details', async () => {
      await journey.answerContact();
      await pages.contactDetails.open(reference, false);
      await pages.contactDetails.heading.waitFor();
      await runA11yScan();
      await pages.hub.open(reference, false);
      await pages.hub.heading.waitFor();
    });

    await test.step('Nominated contacts repeating group', async () => {
      await journey.answerNominatedContacts([
        { name: 'Nominated Agent', email: 'nominated.agent@example.com', telephone: '+44 7700 900125', isAgent: true },
        { name: 'Responsible Person', email: 'responsible.person@example.com', telephone: '+44 7700 900124' },
      ]);
      await pages.nominatedContact.open(reference, false);
      await pages.nominatedContact.heading.waitFor();
      await runA11yScan();
      await pages.hub.open(reference, false);
      await pages.hub.heading.waitFor();
    });

    await test.step('Accompanying documents repeating group', async () => {
      await journey.answerDocuments([
        { type: documentTypes.phytosanitaryCertificate.value, reference: 'PP-DOC-1', issueDate: '4/12/2025' },
        { type: documentTypes.phytosanitaryCertificate.value, reference: 'PP-DOC-2', issueDate: '4/12/2025' },
      ]);
      await pages.accompanyingDocuments.open(reference, false);
      await pages.accompanyingDocuments.heading.waitFor();
      await runA11yScan();
      await pages.hub.open(reference, false);
      await pages.hub.heading.waitFor();
    });

    await test.step('Traders', async () => {
      await pages.hub.task('Traders').click();
      await pages.tradersAddresses.heading.waitFor();
      await pages.tradersAddresses.addConsignor.click();

      await pages.consignorCreate.heading.waitFor();
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
      await runA11yScan();
      await pages.consignorCreate.saveAndContinue.click();

      await pages.consignorConfirmation.heading.waitFor();
      await runA11yScan();
      await pages.consignorConfirmation.addToNotification.click();

      await pages.tradersAddresses.heading.waitFor();
      await pages.tradersAddresses.destinationSameAsConsignee(true).check();
      await runA11yScan({ exclude: deliveryAddressConditionalRadio });
      await pages.tradersAddresses.saveAndReturnToHub.click();
      await pages.hub.heading.waitFor();
    });

    await test.step('Notification overview with completed spokes', async () => {
      await runA11yScan();
    });

    await test.step('Review notification', async () => {
      await pages.hub.task('Review and submit').click();
      await pages.reviewNotification.heading.waitFor();
      // Trace finding: the legacy review surface had three different actions all named
      // "Copy". Axe cannot detect that semantic ambiguity. The rebuilt review currently
      // exposes contextual Change links, so this scan is not proof that action names
      // remain distinguishable without a separate semantic assertion.
      await runA11yScan();
      await pages.reviewNotification.continueButton.click();
    });

    await test.step('Declaration after input', async () => {
      await pages.declaration.heading.waitFor();
      await pages.declaration.declaration.check();
      await runA11yScan();
      await pages.declaration.submitNotification.click();
    });

    await test.step('Import notification sent', async () => {
      await pages.confirmation.heading.waitFor();
      await runA11yScan();
    });
  });
});
