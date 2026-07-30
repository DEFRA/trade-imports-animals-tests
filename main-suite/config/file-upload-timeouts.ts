import { timeouts } from '@main-config/timeouts';

/** Timeouts for file uploads and virus scanning. */
export const fileUploadTimeouts = {
  documentsListVisible: timeouts.medium,
  virusScanComplete: timeouts.long,
} as const;
