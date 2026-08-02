export const importPurposes = {
  internalMarket: { value: 'INTERNAL_MARKET', display: 'Internal market' },
  reEntry: { value: 'RE_ENTRY', display: 'Re-entry' },
  reConformityCheck: { value: 'RE_CONFORMITY_CHECK', display: 'For import re-conformity check' },
} as const;

export type ImportPurpose = (typeof importPurposes)[keyof typeof importPurposes];
