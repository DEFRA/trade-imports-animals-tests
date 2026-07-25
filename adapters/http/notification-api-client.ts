import type { APIRequestContext } from '@playwright/test';
import { RestClient } from '@adapters/http/rest-client';
import { getBackendBaseUrl, getDeveloperApiKey } from '@config/service-base-urls';
import { defaultOwner, type Fulfilment, type Owner, type PersistedFulfilmentEntry } from '@domain/models/api/fulfilment';

export class NotificationApiClient {
  private readonly rest: RestClient;

  constructor(
    request: APIRequestContext,
    baseUrl: string = getBackendBaseUrl(),
    apiKey: string | undefined = getDeveloperApiKey(),
    readonly owner: Owner = defaultOwner,
  ) {
    this.rest = new RestClient(baseUrl, request, apiKey);
  }

  private ownerHeaders(owner: Owner = this.owner): Record<string, string> {
    return {
      'X-Owner-Id': owner.id,
      'X-Owner-Organisation': owner.organisation,
    };
  }

  async createFulfilment(owner: Owner = this.owner): Promise<Fulfilment> {
    return this.rest.post<Fulfilment>('/fulfilments', undefined, this.ownerHeaders(owner));
  }

  async replaceFulfilment(id: string, fulfilment: PersistedFulfilmentEntry[], owner: Owner = this.owner): Promise<Fulfilment> {
    return this.rest.put<Fulfilment>(`/fulfilments/${id}`, { id, fulfilment }, this.ownerHeaders(owner));
  }

  async getFulfilment(id: string, owner: Owner = this.owner): Promise<Fulfilment> {
    return this.rest.get<Fulfilment>(`/fulfilments/${id}`, this.ownerHeaders(owner));
  }

  async submitNotification(id: string, owner: Owner = this.owner): Promise<Fulfilment> {
    return this.rest.post<Fulfilment>(`/fulfilments/${id}/submit`, undefined, this.ownerHeaders(owner));
  }

  async amendNotification(id: string, owner: Owner = this.owner): Promise<Fulfilment> {
    return this.rest.post<Fulfilment>(`/fulfilments/${id}/amend`, undefined, this.ownerHeaders(owner));
  }

  async cancelAmend(id: string, owner: Owner = this.owner): Promise<Fulfilment> {
    return this.rest.post<Fulfilment>(`/fulfilments/${id}/cancel-amend`, undefined, this.ownerHeaders(owner));
  }

  async copyNotification(id: string, idempotencyKey: string, owner: Owner = this.owner): Promise<Fulfilment> {
    return this.rest.post<Fulfilment>(`/fulfilments/${id}/copy`, undefined, {
      ...this.ownerHeaders(owner),
      'Idempotency-Key': idempotencyKey,
    });
  }

  async softDeleteNotification(id: string, owner: Owner = this.owner): Promise<Fulfilment> {
    return this.rest.post<Fulfilment>(`/fulfilments/${id}/soft-delete`, undefined, this.ownerHeaders(owner));
  }
}
