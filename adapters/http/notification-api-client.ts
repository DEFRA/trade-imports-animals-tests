import type { APIRequestContext } from '@playwright/test';
import { RestClient, RestClientError } from '@adapters/http/rest-client';
import { getBackendBaseUrl, getDeveloperApiKey } from '@config/service-base-urls';
import type { NotificationFulfilments } from '@domain/models/api/notification-fulfilments';
import type { Notification } from '@domain/models/api/notification';

// Per-aggregate outbox lock (NotificationService.writeWithOutbox via ShedLock) fails a
// second submit/amend that lands inside the first's lock window with a 500. Human clicks
// never race like this; back-to-back API calls in a test do. Retry policy matches the
// old amendNotificationWhenOutboxFree helper in ApiJourney (3 attempts, linear backoff).
const OUTBOX_LOCK_RETRY_ATTEMPTS = 3;
const OUTBOX_LOCK_RETRY_BASE_MS = 500;

/**
 * HTTP client for the notification api.
 */
export class NotificationApiClient {
  private readonly rest: RestClient;

  constructor(request: APIRequestContext, baseUrl: string = getBackendBaseUrl(), apiKey: string | undefined = getDeveloperApiKey()) {
    this.rest = new RestClient(baseUrl, request, apiKey);
  }

  async getNotificationFulfilments(id: string): Promise<NotificationFulfilments> {
    return this.rest.get<NotificationFulfilments>(`/notifications/${id}/fulfilments`);
  }

  /**
   * Mint a new notification. Empty body → server mints the reference number via
   * ReferenceNumberGenerator and returns it in the response body.
   */
  async createNotification(body: Record<string, unknown> = {}): Promise<Notification> {
    return this.rest.post<Notification>('/notifications', body);
  }

  /**
   * Whole-record replace of an existing notification via PUT /notifications/{id}.
   * 404 if the reference is unknown.
   */
  async saveNotification(id: string, body: Record<string, unknown> = {}): Promise<Notification> {
    return this.rest.put<Notification>(`/notifications/${id}`, body);
  }

  async submitNotification(id: string): Promise<Notification> {
    return this.retryOnTransientOutboxLock(() => this.rest.post<Notification>(`/notifications/${id}/submit`));
  }

  async amendNotification(id: string): Promise<Notification> {
    return this.retryOnTransientOutboxLock(() => this.rest.post<Notification>(`/notifications/${id}/amend`));
  }

  async cancelAmendNotification(id: string): Promise<Notification> {
    return this.rest.post<Notification>(`/notifications/${id}/cancel-amend`);
  }

  async copyNotification(id: string, concurrencyToken: number): Promise<Notification> {
    return this.rest.post<Notification>(`/notifications/${id}/copy?concurrencyToken=${concurrencyToken}`);
  }

  async softDeleteNotification(id: string): Promise<Notification> {
    return this.rest.post<Notification>(`/notifications/${id}/soft-delete`);
  }

  private async retryOnTransientOutboxLock<T>(action: () => Promise<T>): Promise<T> {
    for (let attempt = 1; ; attempt += 1) {
      try {
        return await action();
      } catch (error) {
        const transientLock = error instanceof RestClientError && error.status === 500;
        if (!transientLock || attempt >= OUTBOX_LOCK_RETRY_ATTEMPTS) throw error;
        await new Promise((resolve) => setTimeout(resolve, OUTBOX_LOCK_RETRY_BASE_MS * attempt));
      }
    }
  }
}
