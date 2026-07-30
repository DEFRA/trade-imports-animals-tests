import type { APIRequestContext } from '@playwright/test';
import { RestClient } from '@adapters/http/rest-client';
import { getBackendBaseUrl, getDeveloperApiKey } from '@config/service-base-urls';
import type { Fulfilment, PersistedFulfilmentEntry } from '@domain/models/api/fulfilment';

export class NotificationApiClient {
  private readonly rest: RestClient;

  constructor(request: APIRequestContext, baseUrl: string = getBackendBaseUrl(), apiKey: string | undefined = getDeveloperApiKey()) {
    this.rest = new RestClient(baseUrl, request, apiKey);
  }

  async createFulfilment(): Promise<Fulfilment> {
    return this.rest.post<Fulfilment>('/fulfilments');
  }

  async replaceFulfilment(id: string, fulfilment: PersistedFulfilmentEntry[]): Promise<Fulfilment> {
    return this.rest.put<Fulfilment>(`/fulfilments/${id}`, { id, fulfilment });
  }

  /**
   * Seed the "current" notification projection (Mapper A). Every UI save writes this alongside the
   * fulfilment; an API seed must create it too, or the UI's GET /notifications/{id} 404s and the save
   * fails. Only referenceNumber is required — the first UI save overwrites the rest.
   */
  async replaceNotification(id: string, body: Record<string, unknown> = {}): Promise<void> {
    await this.rest.put<unknown>(`/notifications/${id}`, { referenceNumber: id, ...body });
  }

  /** Seed the "proposed"/new notification projection (Mapper B). See replaceNotification. */
  async replaceProposedNotification(id: string, body: Record<string, unknown> = {}): Promise<void> {
    await this.rest.put<unknown>(`/proposed-notifications/${id}`, { referenceNumber: id, ...body });
  }

  async getFulfilment(id: string): Promise<Fulfilment> {
    return this.rest.get<Fulfilment>(`/fulfilments/${id}`);
  }

  async submitNotification(id: string): Promise<Fulfilment> {
    return this.rest.post<Fulfilment>(`/fulfilments/${id}/submit`);
  }

  async amendNotification(id: string): Promise<Fulfilment> {
    return this.rest.post<Fulfilment>(`/fulfilments/${id}/amend`);
  }

  async cancelAmend(id: string): Promise<Fulfilment> {
    return this.rest.post<Fulfilment>(`/fulfilments/${id}/cancel-amend`);
  }

  async copyNotification(id: string, idempotencyKey: string): Promise<Fulfilment> {
    return this.rest.post<Fulfilment>(`/fulfilments/${id}/copy`, undefined, {
      'Idempotency-Key': idempotencyKey,
    });
  }

  async softDeleteNotification(id: string): Promise<Fulfilment> {
    return this.rest.post<Fulfilment>(`/fulfilments/${id}/soft-delete`);
  }
}
