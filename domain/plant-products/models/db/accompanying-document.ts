import type { ObjectId } from 'mongodb';

export type PlantProductsAccompanyingDocument = {
  _id: ObjectId;
  notificationReferenceNumber: string;
  documentType: string;
  documentReference: string;
  issueDate: Date;
  created?: Date | null;
  updated?: Date | null;
};

// File bytes and AV scan state are deferred. This pass-one model deliberately promises neither.
