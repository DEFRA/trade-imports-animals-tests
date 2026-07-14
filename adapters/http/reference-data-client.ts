import { RestClient } from '@adapters/http/rest-client';
import { getReferenceDataBaseUrl } from '@config/service-base-urls';

export type ReferenceDataItem = {
  code: string;
  name: string;
};

/** The country block the frontend origin page requests. */
export const SPS_EXPORT_COUNTRY_BLOCK = 'GBNAG_SPS_EX';

const cache = new Map<string, Promise<ReferenceDataItem[]>>();

export class ReferenceDataClient {
  private readonly rest: RestClient;

  constructor(baseUrl: string = getReferenceDataBaseUrl()) {
    this.rest = new RestClient(baseUrl);
  }

  async getCountries(block: string = SPS_EXPORT_COUNTRY_BLOCK): Promise<ReferenceDataItem[]> {
    return this.cached(`countries:${block}`, `/countries?blocks=${block}`);
  }

  async getPortsOfEntry(): Promise<ReferenceDataItem[]> {
    return this.cached('ports-of-entry', '/ports-of-entry');
  }

  private async cached(key: string, path: string): Promise<ReferenceDataItem[]> {
    const existing = cache.get(key);
    if (existing !== undefined) {
      return existing;
    }
    const pending = this.rest.get<ReferenceDataItem[]>(path);
    cache.set(key, pending);
    void pending.catch(() => cache.delete(key));
    return pending;
  }
}
