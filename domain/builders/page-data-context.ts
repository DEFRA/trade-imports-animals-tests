import type { ReferenceDataItem } from '@adapters/http/reference-data-client';

/** Reference data the page builders draw on, fetched once per worker. */
export type PageDataContext = {
  countries: ReferenceDataItem[];
};
