import type { APIRequestContext } from '@playwright/test';
import { RestClient, RestClientError } from '@adapters/http/rest-client';
import { getBackendBaseUrl, getDeveloperApiKey } from '@config/service-base-urls';
import type { NotificationFulfilments, PersistedFulfilmentEntry } from '@domain/models/api/notification-fulfilments';
import type { Notification } from '@domain/models/api/notification';

// Per-aggregate outbox lock (NotificationService.writeWithOutbox via ShedLock) fails a
// second submit/amend that lands inside the first's lock window with a 500. Human clicks
// never race like this; back-to-back API calls in a test do. Retry policy matches the
// old amendNotificationWhenOutboxFree helper in ApiJourney (3 attempts, linear backoff).
const OUTBOX_LOCK_RETRY_ATTEMPTS = 3;
const OUTBOX_LOCK_RETRY_BASE_MS = 500;

/**
 * HTTP client for the merged notification aggregate (EUDPA-323). Writes and lifecycle
 * transitions live under {@code /notifications/…}; the fulfilment-view GET stays on
 * {@code /notification-fulfilments/{id}} for journey rehydrate.
 */
export class NotificationApiClient {
  private readonly rest: RestClient;

  constructor(request: APIRequestContext, baseUrl: string = getBackendBaseUrl(), apiKey: string | undefined = getDeveloperApiKey()) {
    this.rest = new RestClient(baseUrl, request, apiKey);
  }

  // --- Fulfilment-view read (surviving endpoint) ---

  /**
   * Read the merged aggregate through the fulfilment-view projection. Returns id
   * (= referenceNumber), status, dates, and the opaque fulfilments payload.
   */
  async getNotificationFulfilments(id: string): Promise<NotificationFulfilments> {
    return this.rest.get<NotificationFulfilments>(`/notification-fulfilments/${id}`);
  }

  // --- Notification write surface (merged, POST/PUT/DELETE /notifications…) ---

  /**
   * Mint a new merged notification. Empty body → server mints the reference number
   * via ReferenceNumberGenerator; pass a body with `fulfilments` (and any
   * notification-shape fields) to seed content at create time.
   */
  async createNotification(body: Record<string, unknown> = {}): Promise<Notification> {
    return this.rest.post<Notification>('/notifications', body);
  }

  /**
   * Replace the merged aggregate at the given reference. Body carries the
   * notification-shape fields + the opaque fulfilments payload. Backend enforces
   * a state guard (DRAFT or AMEND only).
   *
   * Intentionally retained as an API-client extension point: today's ApiJourney
   * bootstrap seeds fulfilments through createNotification(...) directly, so no
   * production caller invokes replaceNotification, but future specs covering the
   * write-then-mutate flow (e.g. dashboard-driven edits, amend-then-replace)
   * need a first-class client method to hit PUT /notifications/{ref} rather
   * than an ad-hoc REST call.
   */
  async replaceNotification(id: string, body: Record<string, unknown> = {}): Promise<Notification> {
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

  /**
   * Copy the merged aggregate. Copy dedup dropped pending EUDPA-314 — no
   * Idempotency-Key header; retries produce distinct copies.
   */
  async copyNotification(id: string): Promise<Notification> {
    return this.rest.post<Notification>(`/notifications/${id}/copy`);
  }

  async softDeleteNotification(id: string): Promise<Notification> {
    return this.rest.post<Notification>(`/notifications/${id}/soft-delete`);
  }

  /**
   * Convenience: replace and coerce the response to the fulfilment-view shape by
   * fetching through the read projection immediately after. Intentionally
   * retained as an API-client extension point: ApiJourney was simplified to
   * seed via createNotification({fulfilments: contents}) so no production
   * caller invokes this today, but the bootstrap-then-replace flow (e.g.
   * mint-then-mutate specs, admin re-seed) is expected to want a one-call
   * helper that returns the fulfilment-view shape without the caller having
   * to plumb the follow-up GET.
   */
  async replaceAndReadAsFulfilments(id: string, fulfilments: PersistedFulfilmentEntry[]): Promise<NotificationFulfilments> {
    await this.replaceNotification(id, { referenceNumber: id, fulfilments });
    return this.getNotificationFulfilments(id);
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
