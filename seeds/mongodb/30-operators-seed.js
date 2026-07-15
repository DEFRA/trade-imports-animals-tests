/**
 * Seeds 30 ACTIVE operators for a single test crn into the trade-imports-operators
 * database (its own database on the shared mongodb container, collection `operators`).
 *
 * Pagination (EUDPA-185.AC4: first 25 then paginate) is only exercisable above 25
 * rows, so 30 gives page 1 = 25 and page 2 = 5 for one crn. Types, towns, countries
 * and names vary so the ?operator_type= filter and the ?q= server-side search
 * (including the c-004 country display-name match) have something to bite on; the
 * TRANSPORTER rows carry approvalNumber + transporterCategory.
 *
 * Mongo stores the entity field names (camelCase) — snake_case is only the JSON wire
 * boundary. Enum fields are the enum name() strings.
 */

db = db.getSiblingDB('trade-imports-operators');

const CRN = '1100014934';
const ORGANISATION_ID = '5a8d2b19-6f4e-4d21-9c1b-7e3f0a2d5c88';

const operatorTypes = [
  'PLACE_OF_ORIGIN',
  'CONSIGNOR',
  'CONSIGNEE',
  'IMPORTER',
  'PLACE_OF_DESTINATION',
  'TRANSPORTER',
  'BRANCH_ADDRESS',
];
const names = [
  'Highland Livestock Ltd',
  'Lowland Cattle Co',
  'Border Beef Partners',
  'Glen Valley Farms',
  'Coastal Poultry Ltd',
];
const towns = ['Inverness', 'Perth', 'Aberdeen', 'Stirling', 'Dumfries'];
const counties = ['Highland', 'Perthshire', 'Aberdeenshire', 'Stirlingshire', ''];
const countries = ['United Kingdom', 'Ireland', 'France', 'Germany'];
const postcodes = ['IV2 3JH', 'PH1 5AA', 'AB10 1AB', 'FK8 2QG', 'DG1 2RW'];

function buildOperator(index) {
  const operatorType = operatorTypes[index % operatorTypes.length];
  const day = String((index % 28) + 1).padStart(2, '0');
  const timestamp = ISODate(`2026-06-${day}T09:15:27.000Z`);

  const operator = {
    _id: ObjectId(`6a5702e4cafe2026${String(index).padStart(8, '0')}`),
    operatorType: operatorType,
    name: `${names[index % names.length]} ${index}`,
    addressLine1: `${index} Drover's Way`,
    addressLine2: `Unit ${index}`,
    town: towns[index % towns.length],
    county: counties[index % counties.length],
    postcode: postcodes[index % postcodes.length],
    country: countries[index % countries.length],
    telephone: `+44 1463 ${String(200000 + index)}`,
    email: `ops${index}@seed.example.com`,
    crn: CRN,
    organisationId: ORGANISATION_ID,
    status: 'ACTIVE',
    createdAt: timestamp,
    modifiedAt: timestamp,
    _class: 'uk.gov.defra.trade.imports.operators.operator.Operator',
  };

  if (operatorType === 'TRANSPORTER') {
    operator.approvalNumber = `APR-${String(index).padStart(4, '0')}`;
    operator.transporterCategory = index % 2 === 0 ? 'COMMERCIAL' : 'PRIVATE';
  }

  return operator;
}

db.operators.deleteMany({ crn: CRN });

const operators = [];
for (let index = 1; index <= 30; index += 1) {
  operators.push(buildOperator(index));
}

db.operators.insertMany(operators);
