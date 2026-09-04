import type { ObjectId } from 'mongodb';
import type { PersistedFulfilmentEntry } from '@domain/models/api/notification-fulfilments';

/**
 * A Standard Address Block as the backend stores it. Field names follow the
 * address book, which is the system of record (EUDPA-294 replaced an older
 * shape carrying `addressLine3`, `city` and a free-text `country`).
 */
type StoredAddress = {
  addressLine1: string;
  addressLine2?: string;
  townOrCity: string;
  county?: string;
  postcode: string;
  countryCode: string;
};

/**
 * A party on a notification, held one of two ways (EUDPA-294 AC5).
 *
 * Picked from the address book, only `addressId` is stored — the details are
 * resolved on read, so an edit in the address book shows through without the
 * notification being rewritten. Entered inline, or created before the address
 * book existed, the details are on the notification and there is no
 * `addressId`. Every field is therefore optional.
 */
type StoredParty = {
  addressId?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: StoredAddress;
};

/**
 * Notification content held under {@link NotificationDocument#notification}.
 * Aggregate metadata (referenceNumber, status, dates, fulfilments) lives at
 * the document root; only the well-structured content sits here (EUDPA-335).
 */
type NotificationContent = {
  origin: {
    countryCode: string;
    requiresRegionCode: string;
    internalReference?: string;
  };
  commodity: {
    name: string;
    commodityComplement: Array<{
      typeOfCommodity: string;
      species: Array<{
        value: string;
        text: string;
        noOfAnimals: number;
        noOfPackages: number;
        earTag: string;
        passport: string;
      }>;
      totalNoOfAnimals: number;
      totalNoOfPackages: number;
    }>;
  };
  reasonForImport: string;
  additionalDetails: {
    certifiedFor?: string;
    unweanedAnimals: string;
  };
  placeOfOrigin?: StoredParty;
  consignor?: StoredParty;
  consignee?: StoredParty;
  importer?: StoredParty;
  destination?: StoredParty;
  cphNumber?: string;
  transport: {
    portOfEntry?: string;
    arrivalDate?: Date;
    meansOfTransport: string;
    transportIdentification?: string;
    transportDocumentReference?: string;
    transitedCountries?: string[];
    // Not an address-book record: a transporter carries an approval number and
    // a type, which the address book has no room for, so it stays inline.
    transporter?: {
      name: string;
      address: StoredAddress;
      approvalNumber: string;
      type: string;
    };
  };
  consignment?: StoredParty;
};

export type NotificationDocument = {
  _id: ObjectId;
  referenceNumber: string | null;
  notification: NotificationContent;
  /** The obligation payload the frontend owns; `notification` above is its mapped projection. */
  fulfilments?: PersistedFulfilmentEntry[];
  status: string;
  created: Date;
  updated: Date;
  _class: string;
};
