/**
 * Seeds the address book for the E2E signed-in organisation.
 *
 * Before EUDPA-294 the party pickers were backed by hardcoded lists inside the
 * frontend, so a spec could name a record and know it was there. The pickers
 * now read the real address book, and the frontend ships no data at all — so
 * the records the specs pick have to exist in the address book before the
 * browser opens.
 *
 * Seeded back-door (straight into Mongo) rather than through the API because
 * this must be in place before any spec runs, and because `createdAt` has to be
 * set explicitly: the address book lists newest first, so fixed timestamps are
 * what make "these five are on page one" a stable assertion rather than a race
 * with insertion order.
 *
 * Organisation 5900001 (Gatwick Airport) is the one CRN 2100010101 — the
 * default E2E sign-in — holds. An address is only ever visible to its owning
 * organisation, so seeding under any other id would leave the book looking
 * empty.
 */

db = db.getSiblingDB('trade-imports-address-book');

const ORGANISATION_ID = '5900001';

/**
 * The picker shows five per page, and this list is in page order — so rows 1-5
 * are page one, 6-10 page two, and the rest page three.
 *
 * Page one holds the five parties the shared journey walk picks from the
 * paginated pickers (flows/journey.ts `fillAddressesToCph`), so that walk never
 * has to paginate. Pages two and three exist so the pagination and search specs
 * have somewhere to go.
 *
 * The walk picks a SIXTH party on the contact-address page (`answerContact`),
 * which is a flat unpaginated radio list — so that record only has to exist,
 * not to sit on any particular page.
 *
 * `countryCode` is what the address book stores and the frontend maps back to
 * a display name through the reference-data country list. That list is the
 * countries you can export FROM, so it has no entry for the UK — the journey's
 * own create-address form sends the literal "United Kingdom" through in the
 * same field for exactly that reason, and these fixtures match it, so a seeded
 * UK address renders identically to one a trader saved.
 */
const records = [
  ['Astra Rosales', '43 East Hague Extension', 'Bern', '30055', 'CH'],
  ['Tech Imports Ltd', '18 Dockside Road', 'London', 'E14 9GE', 'United Kingdom'],
  ['Origin Farm', '1 Farm Lane', 'Ennis', 'V95 X7P2', 'IE'],
  ['British Livestock Ltd', '10 Market Street', 'Leeds', 'LS1 6HB', 'United Kingdom'],
  ['Import Co UK', '20 Trade Road', 'London', 'EC1A 1BB', 'United Kingdom'],

  ['Animal and Plant Health Agency', 'Woodham Lane', 'Addlestone', 'KT15 3NB', 'United Kingdom'],
  ['Danish Meat Export ApS', 'Havnegade 21', 'Copenhagen', '1058', 'DK'],
  ['Jutland Swine ApS', 'Sondergade 4', 'Aarhus', '8000', 'DK'],
  ['Laiterie du Nord SARL', '12 Rue de la Gare', 'Lille', '59000', 'FR'],
  ['Nordvik Seafood AS', 'Havnegata 8', 'Alesund', '6002', 'NO'],

  ['Alpine Dairy GmbH', 'Bahnhofstrasse 17', 'Innsbruck', '6020', 'AT'],
  ['Irish Beef Traders Ltd', 'Castle Road 9', 'Kilkenny', 'R95 F2X8', 'IE'],
  ['Iberian Swine SA', 'Calle Mayor 44', 'Huesca', '22001', 'ES'],
];

function buildAddress(row, index) {
  const [name, addressLine1, townOrCity, postcode, countryCode] = row;

  // Newest first, so index 0 is the first row on page one.
  //
  // The year is deliberately far in the future. A spec that adds an address
  // gets a `createdAt` of now, which would otherwise sort it ABOVE these and
  // push every fixture down a row — so which page a fixture sat on would
  // depend on what other specs had already run. Dating the fixtures ahead pins
  // them to the front of the book and sends anything a run creates to the back.
  const createdAt = ISODate(`2099-01-01T${String(23 - index).padStart(2, '0')}:00:00.000Z`);

  return {
    _id: ObjectId(`69c12f11beef2026${String(index + 1).padStart(8, '0')}`),
    name,
    addressLine1,
    townOrCity,
    postcode,
    countryCode,
    phone: '+44 1234 567890',
    email: 'contact@example.com',
    organisationId: ORGANISATION_ID,
    status: 'ACTIVE',
    createdAt,
    modifiedAt: createdAt,
    version: NumberLong(0),
    _class: 'uk.gov.defra.trade.imports.addressbook.address.Address',
  };
}

db.addresses.insertMany(records.map(buildAddress));
