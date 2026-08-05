import type { APIRequestContext } from '@playwright/test';
import { RestClient, RestClientError } from '@adapters/http/rest-client';
import { getBackendBaseUrl, getDeveloperApiKey } from '@config/service-base-urls';
import type { NotificationFulfilments, PersistedFulfilmentEntry } from '@domain/live-animals/models/api/notification-fulfilments';
import type { Notification } from '@domain/live-animals/models/api/notification';

// Per-aggregate outbox lock (NotificationService.writeWithOutbox via ShedLock) fails a
// second submit/amend that lands inside the first's lock window with a 500. Human clicks
// never race like this; back-to-back API calls in a test do. Retry policy matches the
// old amendNotificationWhenOutboxFree helper in ApiJourney (3 attempts, linear backoff).
const OUTBOX_LOCK_RETRY_ATTEMPTS = 3;
const OUTBOX_LOCK_RETRY_BASE_MS = 500;

/**
 * HTTP client for the spike's dual persistence surface. Every write path that
 * needs to reflect in admin (which reads notifications) requires both a
 * notification-fulfilments call and a notification call.
 *
 * Methods suffixed *NotificationFulfilments hit /notification-fulfilments/{id}/…;
 * methods suffixed *Notification hit /notifications/{id}/…
 */
export class NotificationApiClient {
  private readonly rest: RestClient;

  constructor(request: APIRequestContext, baseUrl: string = getBackendBaseUrl(), apiKey: string | undefined = getDeveloperApiKey()) {
    this.rest = new RestClient(baseUrl, request, apiKey);
  }

  // --- NotificationFulfilments aggregate (spike-only, POST /notification-fulfilments…) ---

  async createNotificationFulfilments(): Promise<NotificationFulfilments> {
    return this.rest.post<NotificationFulfilments>('/notification-fulfilments');
  }

  async replaceNotificationFulfilments(id: string, fulfilments: PersistedFulfilmentEntry[]): Promise<NotificationFulfilments> {
    return this.rest.put<NotificationFulfilments>(`/notification-fulfilments/${id}`, { id, fulfilments });
  }

  async getNotificationFulfilments(id: string): Promise<NotificationFulfilments> {
    return this.rest.get<NotificationFulfilments>(`/notification-fulfilments/${id}`);
  }

  async submitNotificationFulfilments(id: string): Promise<NotificationFulfilments> {
    return this.rest.post<NotificationFulfilments>(`/notification-fulfilments/${id}/submit`);
  }

  async amendNotificationFulfilments(id: string): Promise<NotificationFulfilments> {
    return this.rest.post<NotificationFulfilments>(`/notification-fulfilments/${id}/amend`);
  }

  async cancelAmendNotificationFulfilments(id: string): Promise<NotificationFulfilments> {
    return this.rest.post<NotificationFulfilments>(`/notification-fulfilments/${id}/cancel-amend`);
  }

  async copyNotificationFulfilments(id: string, idempotencyKey: string): Promise<NotificationFulfilments> {
    return this.rest.post<NotificationFulfilments>(`/notification-fulfilments/${id}/copy`, undefined, {
      'Idempotency-Key': idempotencyKey,
    });
  }

  async softDeleteNotificationFulfilments(id: string): Promise<NotificationFulfilments> {
    return this.rest.post<NotificationFulfilments>(`/notification-fulfilments/${id}/soft-delete`);
  }

  // --- Notification aggregate (matches main, POST /notifications…) ---

  /**
   * Mint a new notification. Empty body → server mints the reference number via
   * ReferenceNumberGenerator and returns it in the response body.
   */
  async createNotification(body: Record<string, unknown> = {}): Promise<Notification> {
    return this.rest.post<Notification>('/notifications', body);
  }

  /**
   * Whole-record update of an existing notification. `referenceNumber` in the
   * body is required — main's `saveOriginOfImport` delegates to
   * `updateNotification` (find-by-ref, replace), and 404s if the record does
   * not exist.
   */
  async saveNotification(id: string, body: Record<string, unknown> = {}): Promise<Notification> {
    return this.rest.post<Notification>('/notifications', { referenceNumber: id, ...body });
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

  async copyNotification(id: string): Promise<Notification> {
    return this.rest.post<Notification>(`/notifications/${id}/copy`);
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
