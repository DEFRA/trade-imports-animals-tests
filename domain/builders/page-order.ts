import type { Notification } from '@domain/models/api/notification';
import type { PageDataContext } from '@domain/builders/page-data-context';
import { originOfImport } from '@domain/builders/pages/origin-of-import';
import { commoditySelection } from '@domain/builders/pages/commodity-selection';
import { speciesSelection } from '@domain/builders/pages/species-selection';
import { importReason } from '@domain/builders/pages/import-reason';
import { commodityDetails } from '@domain/builders/pages/commodity-details';
import { animalIdentification } from '@domain/builders/pages/animal-identification';
import { additionalDetails } from '@domain/builders/pages/additional-details';
import { accompanyingDocuments } from '@domain/builders/pages/accompanying-documents';
import { placeOfOrigin } from '@domain/builders/pages/place-of-origin';
import { consignor } from '@domain/builders/pages/consignor';
import { consignee } from '@domain/builders/pages/consignee';
import { importer } from '@domain/builders/pages/importer';
import { destination } from '@domain/builders/pages/destination';
import { cphNumber } from '@domain/builders/pages/cph-number';
import { portOfEntry } from '@domain/builders/pages/port-of-entry';
import { transporter } from '@domain/builders/pages/transporter';
import { contactAddress } from '@domain/builders/pages/contact-address';

/**
 * UI pages in journey order. Each page function applies exactly the
 * notification fields that page's save-and-continue gathers, so a draft built
 * through page N matches one a user saved up to page N.
 *
 * The address-select pages (place-of-origin through cph-number) only write
 * session in the real UI — the addresses hub save persists them — so
 * persisted UI states exist only at saving-page boundaries, but the helper
 * permits any prefix.
 */
export const journeyPages = [
  'origin-of-import',
  'commodity-selection',
  'species-selection',
  'import-reason',
  'commodity-details',
  'animal-identification',
  'additional-details',
  'accompanying-documents',
  'place-of-origin',
  'consignor',
  'consignee',
  'importer',
  'destination',
  'cph-number',
  'port-of-entry',
  'transporter',
  'contact-address',
] as const;

export type JourneyPage = (typeof journeyPages)[number];

export type PageContribution = (draft: Notification, ctx: PageDataContext) => void;

export const pageContributions: Record<JourneyPage, PageContribution> = {
  'origin-of-import': originOfImport,
  'commodity-selection': commoditySelection,
  'species-selection': speciesSelection,
  'import-reason': importReason,
  'commodity-details': commodityDetails,
  'animal-identification': animalIdentification,
  'additional-details': additionalDetails,
  'accompanying-documents': accompanyingDocuments,
  'place-of-origin': placeOfOrigin,
  consignor,
  consignee,
  importer,
  destination,
  'cph-number': cphNumber,
  'port-of-entry': portOfEntry,
  transporter: transporter,
  'contact-address': contactAddress,
};
