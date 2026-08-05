import { test, expect } from '@fixtures';
import { bcps } from '@domain/plant-products/constants/bcps';
import { commodityCodes } from '@domain/plant-products/constants/commodity-codes';
import { documentTypes } from '@domain/plant-products/constants/document-types';
import { eppoSpecies } from '@domain/plant-products/constants/eppo-species';
import { packageTypes } from '@domain/plant-products/constants/package-types';
import { quantityTypes } from '@domain/plant-products/constants/quantity-types';

const plantUrl = (reference: string, slug = '') =>
  new RegExp(`^/plant-products/notifications/${reference}${slug ? `/${slug}` : ''}(?:\\?.*)?$`);

const commodity = commodityCodes.otherFoliage;
const species = eppoSpecies[commodity.value][1];

const expectedGroups = [
  { heading: '1. Origin of the import', rows: [{ name: 'Origin of the import', status: 'Not yet started' }] },
  { heading: '2. Purpose', rows: [{ name: 'Purpose', status: 'Cannot start yet' }] },
  { heading: '3. Commodity', rows: [{ name: 'Commodity', status: 'Cannot start yet' }] },
  { heading: '4. Additional details', rows: [{ name: 'Additional details', status: 'Cannot start yet' }] },
  { heading: '5. Transport to the BCP', rows: [{ name: 'Transport to the BCP', status: 'Cannot start yet' }] },
  { heading: '6. Goods movement services', rows: [{ name: 'Goods movement services', status: 'Cannot start yet' }] },
  { heading: '7. Contact details', rows: [{ name: 'Contact details', status: 'Cannot start yet' }] },
  { heading: '8. Nominated contacts', rows: [{ name: 'Nominated contacts', status: 'Cannot start yet' }] },
  { heading: '9. Accompanying documents', rows: [{ name: 'Accompanying documents', status: 'Cannot start yet' }] },
  { heading: '10. Traders', rows: [{ name: 'Traders', status: 'Cannot start yet' }] },
  { heading: '12. Review and submit', rows: [{ name: 'Review and submit', status: 'Cannot start yet' }] },
];

const expectedRows = expectedGroups.flatMap(({ rows }) => rows.map(({ name }) => name));

test(
  'the 12-spoke mapping keeps order, status, optional/conditional behaviour, the authored gate and CYA ownership',
  {
    tag: '@integration',
  },
  async ({ plantProductsJourney: journey, plantProductsApi, plantProductsPages: pages }) => {
    test.setTimeout(120_000);
    await journey.toNotificationDashboard();
    await pages.plantNotificationDashboard.createNewNotification.click();
    const reference = pages.importType.journeyIdFromUrl();
    await pages.importType.plants.check();
    await pages.importType.continueButton.click();
    await pages.countryOfOrigin.backLink.click();

    await expect(pages.page.getByText('11. Billing', { exact: true })).toHaveCount(0);
    await expect(pages.page.getByText('Billing', { exact: true })).toHaveCount(0);
    const taskLists = pages.page.locator('main .govuk-task-list');
    await expect(taskLists).toHaveCount(expectedGroups.length);
    for (const [index, group] of expectedGroups.entries()) {
      const taskList = taskLists.nth(index);
      await expect(taskList.locator('xpath=preceding-sibling::*[1][self::h2]')).toHaveText(group.heading);
      await expect(taskList.locator('.govuk-task-list__name-and-hint > :first-child')).toHaveText(group.rows.map(({ name }) => name));
      await expect(taskList.locator('.govuk-task-list__status')).toHaveText(group.rows.map(({ status }) => status));
    }

    await pages.hub.task('Origin of the import').click();
    await journey.fillCountryOfOrigin({ countryOfOrigin: 'France' });
    await journey.saveCountryOfOrigin();
    await pages.originOfImport.backLink.click();
    await expect(pages.hub.rowStatus('Origin of the import')).toHaveText('In progress');
    await journey.answerOrigin();
    await expect(pages.hub.rowStatus('Origin of the import')).toHaveText('Completed');

    await journey.answerPurpose();
    await expect(pages.hub.rowStatus('Purpose')).toHaveText('Completed');
    await expect(pages.hub.rowStatus('Commodity')).toHaveText('Not yet started');
    const commodityOptions = {
      lines: [
        {
          commodityCode: commodity.value,
          commodityDescription: commodity.display,
          species: [species],
          details: {
            numberOfPackages: '4',
            packageType: packageTypes.box.value,
            quantity: '120',
            quantityType: quantityTypes.pieces.value,
            netWeight: '80',
            controlledAtmosphereContainer: false,
            intendedForFinalUsers: true,
            testAndTrial: false,
          },
        },
      ],
    };
    await journey.answerCommodities({ ...commodityOptions, returnAtSummary: true });
    await pages.commoditySummary.backLink.click();
    await expect(pages.hub.rowStatus('Commodity')).toHaveText('In progress');
    await pages.commoditySummary.open(reference, false);
    await pages.commoditySummary.saveAndContinue.click();
    await expect(pages.commodityBulkDetails.heading).toBeVisible();
    await pages.commodityBulkDetails.fill(commodity.value, commodity.display, commodityOptions.lines[0].details);
    await pages.commodityBulkDetails.saveAndContinue.click();
    await expect(pages.hub.rowStatus('Commodity')).toHaveText('Completed');
    await expect(pages.hub.rowStatus('Nominated contacts')).toHaveText('Optional');
    await journey.answerAdditionalDetails({ totalGrossWeight: '100' });
    await expect(pages.hub.rowStatus('Additional details')).toHaveText('Completed');
    await expect(pages.hub.rowStatus('Transport to the BCP')).toHaveText('Not yet started');
    const notificationWithIncompleteTransport = await plantProductsApi.load(reference);
    await plantProductsApi.replace(reference, {
      ...notificationWithIncompleteTransport,
      transport: {
        borderControlPost: bcps.heathrowAirport.value,
        arrivalDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        arrivalTime: '14:50',
      },
    });
    await pages.page.reload();
    await expect(pages.hub.rowStatus('Transport to the BCP')).toHaveText('In progress');
    await journey.answerTransport();
    await expect(pages.hub.rowStatus('Transport to the BCP')).toHaveText('Completed');
    await journey.answerGoodsMovement();
    await expect(pages.hub.rowStatus('Goods movement services')).toHaveText('Completed');
    await journey.answerContact();
    await expect(pages.hub.rowStatus('Contact details')).toHaveText('Completed');
    await journey.answerTraders();
    await expect(pages.hub.rowStatus('Traders')).toHaveText('Completed');

    await expect(pages.hub.rowStatus('Accompanying documents')).toHaveText('Not yet started');
    const partialDocument = await plantProductsApi.addDocument(reference, {
      documentType: documentTypes.phytosanitaryCertificate.value,
      documentReference: 'PP-DOC-PARTIAL',
    });
    await pages.page.reload();
    await expect(pages.hub.rowStatus('Accompanying documents')).toHaveText('In progress');
    if (!partialDocument.id) throw new Error('The partial accompanying document did not receive an id');
    await plantProductsApi.deleteDocument(reference, partialDocument.id);
    await pages.page.reload();

    await expect(pages.page.locator('.govuk-task-list__status')).toHaveText([
      'Completed',
      'Completed',
      'Completed',
      'Completed',
      'Completed',
      'Completed',
      'Completed',
      'Optional',
      'Not yet started',
      'Completed',
      'Cannot start yet',
    ]);
    await expect(pages.hub.task('Review and submit')).toHaveCount(0);

    await journey.answerDocuments([{ type: documentTypes.phytosanitaryCertificate.value, reference: 'PP-DOC-1', issueDate: '4/12/2025' }]);
    await expect(pages.page.locator('.govuk-task-list__status')).toHaveText([
      'Completed',
      'Completed',
      'Completed',
      'Completed',
      'Completed',
      'Completed',
      'Completed',
      'Optional',
      'Completed',
      'Completed',
      'Optional',
    ]);
    await expect(pages.page.locator('.govuk-task-list__name-and-hint')).toContainText(expectedRows);
    await expect(pages.hub.task('Review and submit')).toHaveCount(1);
    await pages.hub.task('Review and submit').click();
    await expect(pages.page).toHaveURL((url) => plantUrl(reference, 'review-notification').test(url.pathname));

    await expect(pages.page.locator('main').getByRole('heading', { level: 2 })).toHaveText([
      'About the consignment',
      'Description of the goods',
      'Additional details',
      'Transport to the Border Control Post',
      'Goods movement services',
      'Contact details',
      'Nominated contacts',
      'Accompanying documents',
      'Traders',
    ]);
    const expectedKeys = new Map<string, string[]>([
      [
        'About the consignment',
        [
          'What are you importing?',
          'Country of origin',
          'Country from where consigned',
          'Internal reference',
          'Purpose of the consignment',
        ],
      ],
      ['Description of the goods', ['How do you want to add your commodity details?']],
      ['Additional details', ['Total gross weight', 'Gross volume', 'Total net weight', 'Total packages']],
      [
        'Transport to the Border Control Post',
        [
          'Border Control Post',
          'Means of transport',
          'Transport identification',
          'Transport document reference',
          'Estimated arrival date',
          'Estimated arrival time',
          'Using containers?',
        ],
      ],
      ['Goods movement services', ['Using the Common Transit Convention (CTC)', 'Using the Goods Vehicle Movement Service (GVMS)']],
      ['Contact details', ['Name', 'Email address', 'Mobile number']],
      [
        'Traders',
        [
          'Importer',
          'Delivery address',
          "Same as the importer's address",
          'Consignor or exporter name',
          'Consignor address line 1',
          'Consignor address line 2',
          'Consignor address line 3',
          'Consignor town or city',
          'Consignor postcode or ZIP code',
          'Consignor telephone number',
          'Consignor country',
          'Consignor email address',
        ],
      ],
    ]);
    for (const [card, keys] of expectedKeys) {
      await expect(pages.reviewNotification.card(card).locator('.govuk-summary-list__key')).toHaveText(keys);
    }
    await expect(
      pages.reviewNotification.card('Nominated contacts').getByText('No nominated contacts added', { exact: true }),
    ).toBeVisible();
    await expect(pages.page.locator('main').getByRole('table')).toHaveCount(4);
    await expect(pages.page.locator('main').getByRole('table').getByRole('caption')).toHaveText([
      'Commodities',
      'Species',
      'Commodity details',
      'Accompanying documents',
    ]);

    const actionHref = (slug: string) => `/plant-products/notifications/${reference}/${slug}?change=1`;
    const expectedActions = [
      { name: 'Change Country of origin', href: actionHref('country-of-origin') },
      { name: 'Change Country from where consigned', href: actionHref('origin-of-import') },
      { name: 'Add a missing answer for internal reference', href: actionHref('origin-of-import') },
      { name: 'Change Purpose of the consignment', href: actionHref('about-the-consignment') },
      { name: 'Change How do you want to add your commodity details?', href: actionHref('commodity-input-method') },
      { name: 'Change commodity 1', href: actionHref('commodity-search') },
      { name: 'Change Total gross weight', href: actionHref('commodity-additional-details') },
      { name: 'Add a missing answer for gross volume', href: actionHref('commodity-additional-details') },
      { name: 'Change Border Control Post', href: actionHref('transport-before-bip') },
      { name: 'Change Means of transport', href: actionHref('transport-before-bip') },
      { name: 'Change Transport identification', href: actionHref('transport-before-bip') },
      { name: 'Change Transport document reference', href: actionHref('transport-before-bip') },
      { name: 'Change Estimated arrival date', href: actionHref('transport-before-bip') },
      { name: 'Change Estimated arrival time', href: actionHref('transport-before-bip') },
      { name: 'Change Using containers?', href: actionHref('transport-before-bip') },
      { name: 'Change Using the Common Transit Convention (CTC)', href: actionHref('goods-movement-services') },
      { name: 'Change Using the Goods Vehicle Movement Service (GVMS)', href: actionHref('goods-movement-services') },
      { name: 'Change Name', href: actionHref('contact-details') },
      { name: 'Change Email address', href: actionHref('contact-details') },
      { name: 'Change Mobile number', href: actionHref('contact-details') },
      { name: 'Change nominated contacts', href: actionHref('nominated-contact') },
      { name: 'Change accompanying documents', href: actionHref('accompanying-documents') },
      { name: 'Change Delivery address', href: actionHref('traders-addresses') },
      { name: 'Change Consignor or exporter name', href: actionHref('consignor-create') },
      { name: 'Change Consignor address line 1', href: actionHref('consignor-create') },
      { name: 'Change Consignor address line 2', href: actionHref('consignor-create') },
      { name: 'Change Consignor address line 3', href: actionHref('consignor-create') },
      { name: 'Change Consignor town or city', href: actionHref('consignor-create') },
      { name: 'Change Consignor postcode or ZIP code', href: actionHref('consignor-create') },
      { name: 'Change Consignor telephone number', href: actionHref('consignor-create') },
      { name: 'Change Consignor country', href: actionHref('consignor-create') },
      { name: 'Change Consignor email address', href: actionHref('consignor-create') },
    ];
    const reviewActions = pages.page.locator('main section a.govuk-link');
    await expect(reviewActions).toHaveCount(expectedActions.length);
    for (const [index, action] of expectedActions.entries()) {
      await expect(reviewActions.nth(index)).toHaveAccessibleName(action.name);
      await expect(reviewActions.nth(index)).toHaveAttribute('href', action.href);
    }

    await pages.reviewNotification.changeLink('Transport to the Border Control Post', 'Means of transport').click();
    await expect(pages.page).toHaveURL((url) => plantUrl(reference, 'transport-before-bip').test(`${url.pathname}${url.search}`));
    await pages.transportBeforeBip.saveAndContinue.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(reference, 'review-notification').test(url.pathname));

    await pages.page.getByRole('link', { name: 'Change accompanying documents', exact: true }).click();
    await expect(pages.page).toHaveURL((url) => plantUrl(reference, 'accompanying-documents').test(`${url.pathname}${url.search}`));
    await pages.accompanyingDocuments.saveAndContinue.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(reference, 'review-notification').test(url.pathname));

    await pages.page.getByRole('link', { name: 'Add a missing answer for internal reference', exact: true }).click();
    await expect(pages.page).toHaveURL((url) => plantUrl(reference, 'origin-of-import').test(`${url.pathname}${url.search}`));
    await pages.originOfImport.internalReference.fill('PP-INTERNAL-1');
    await pages.originOfImport.saveAndContinue.click();
    await expect(pages.page).toHaveURL((url) => plantUrl(reference, 'review-notification').test(url.pathname));
  },
);
