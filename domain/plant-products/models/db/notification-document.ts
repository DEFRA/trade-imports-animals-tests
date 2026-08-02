import type { ObjectId } from 'mongodb';
import type { PlantProductsNotificationDto } from '@domain/plant-products/models/api/notification';

export type PlantProductsNotificationContentSnapshot = Pick<
  PlantProductsNotificationDto,
  | 'origin'
  | 'reasonForImport'
  | 'commodity'
  | 'additionalDetails'
  | 'consignor'
  | 'consignee'
  | 'importer'
  | 'destination'
  | 'packer'
  | 'responsiblePerson'
  | 'nominatedContacts'
  | 'transport'
  | 'goodsMovementServices'
  | 'isCuc'
  | 'billing'
  | 'declaration'
>;

export type PlantProductsNotificationDocument = Omit<PlantProductsNotificationDto, 'created' | 'updated'> & {
  _id: ObjectId;
  created?: Date | null;
  updated?: Date | null;
  /** Globally unique backend key; it is not scoped to the source reference. */
  copyIdempotencyKey?: string | null;
  /** DB-only amend restore point; hidden from API responses by the backend. */
  submittedBaseline?: PlantProductsNotificationContentSnapshot | null;
  /** DB-only sweep timestamp on a plain index, not a Mongo TTL index. */
  expireAt?: Date | null;
};
