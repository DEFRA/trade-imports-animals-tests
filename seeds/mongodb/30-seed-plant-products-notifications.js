/**
 * Active pp-061 dashboard-state fixture. Like the live-animals example, it is flat and numerically
 * ordered after workspace database setup; unlike that inert bulk-pagination example, pp-061 names an
 * active `.js` fixture so reseeding proves the plant collection and DELETED list filtering.
 *
 * Reference values below are transcribed from the frontend plant-products fixture services.
 */

db = db.getSiblingDB('trade-imports-animals-backend');

const seededPlantNotifications = [
  { suffix: 'SEED01', status: 'DRAFT', purpose: 'INTERNAL_MARKET' },
  { suffix: 'SEED02', status: 'SUBMITTED', purpose: 'RE_ENTRY' },
  { suffix: 'SEED03', status: 'AMEND', purpose: 'RE_CONFORMITY_CHECK' },
  { suffix: 'SEED04', status: 'DELETED', purpose: 'INTERNAL_MARKET' },
].map(({ suffix, status, purpose }, index) => ({
  _id: ObjectId(`70a06100000000000000000${index}`),
  referenceNumber: `GBN-PP-26-${suffix}`,
  chedType: 'CHEDPP',
  status,
  ownership: {
    assignedOrganisationId: 'stub-org',
    assignedOrganisationName: 'KING CHARLES III',
  },
  origin: {
    countryCode: 'FR',
    countryOfConsignmentCode: 'FR',
    internalReference: `PP-SEED-${index + 1}`,
  },
  reasonForImport: purpose,
  commodity: {
    name: 'Hyacinths',
    inputMethod: 'MANUAL',
    commodityComplement: [
      {
        uniqueComplementId: `seed-line-${index + 1}`,
        commodityCode: '06011010',
        commodityDescription: 'Hyacinths',
        numberOfPackages: 4,
        packageType: 'BOX',
        quantity: 120,
        quantityType: 'KILOGRAMS',
        netWeight: 80,
        controlledAtmosphereContainer: false,
        finishedOrPropagated: 'FINISHED',
        intendedForFinalUsers: true,
        testAndTrial: false,
        species: [
          {
            eppoCode: 'ABWBR',
            genusAndSpecies: 'Albuca bracteata',
            speciesId: '1325967',
            varieties: [],
          },
        ],
      },
    ],
  },
  declaration: status === 'DRAFT' ? null : { agreed: true, declaredAt: ISODate('2026-08-01T12:00:00.000Z') },
  created: ISODate(`2026-08-01T${String(index + 8).padStart(2, '0')}:00:00.000Z`),
  updated: ISODate(`2026-08-01T${String(index + 8).padStart(2, '0')}:30:00.000Z`),
  _class: 'uk.gov.defra.trade.imports.plantproducts.notification.PlantProductsNotification',
}));

db.plant_products_notification.insertMany(seededPlantNotifications);
