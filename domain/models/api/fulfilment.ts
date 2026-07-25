export const fulfilmentStatuses = {
  draft: 'DRAFT',
  submitted: 'SUBMITTED',
  amend: 'AMEND',
  deleted: 'DELETED',
} as const;

export type FulfilmentStatus = (typeof fulfilmentStatuses)[keyof typeof fulfilmentStatuses];

export type PersistedFulfilmentEntry =
  | { obligationId: string; value: unknown }
  | {
      obligationId: string;
      records: Array<{ fulfilmentId: string; value: unknown }>;
    };

export type Fulfilment = {
  id: string;
  fulfilment: PersistedFulfilmentEntry[];
  submittedFulfilment?: PersistedFulfilmentEntry[] | null;
  status: FulfilmentStatus;
  createdAt: string;
  submittedAt?: string | null;
};

export type Owner = {
  id: string;
  organisation: string;
};

export const defaultOwner: Owner = {
  id: '5add6531-c8c8-4e78-b57b-071002f21887',
  organisation: '5900001',
};
