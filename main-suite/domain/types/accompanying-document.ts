import type { DocumentType } from '@main-domain/constants/document-types';
import type { DateInput } from '@main-domain/types/date-time-input';

export type AccompanyingDocument = {
  filePath: string;
  documentType?: DocumentType;
  documentReference?: string;
  issueDate?: DateInput;
};
