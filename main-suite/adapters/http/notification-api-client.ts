import type { APIRequestContext } from '@playwright/test';
import { RestClient } from '@main-adapters/http/rest-client';
import { getBackendBaseUrl, getDeveloperApiKey } from '@main-config/service-base-urls';
import type { Notification } from '@main-domain/models/api/notification';

export class NotificationApiClient {
  private readonly rest: RestClient;

  constructor(request: APIRequestContext, baseUrl: string = getBackendBaseUrl(), apiKey: string | undefined = getDeveloperApiKey()) {
    this.rest = new RestClient(baseUrl, request, apiKey);
  }

  /**
   * Upserts a notification. A body without referenceNumber creates a new
   * DRAFT (the backend mints and returns the reference); a body carrying one
   * is a full replace, mirroring how the frontend re-posts the whole
   * accumulated payload on every wizard page save.
   */
  async saveNotification(notification: Notification): Promise<Notification> {
    return this.rest.post<Notification>('/notifications', notification);
  }

  async getNotification(referenceNumber: string): Promise<Notification> {
    return this.rest.get<Notification>(`/notifications/${referenceNumber}`);
  }

  async submitNotification(referenceNumber: string): Promise<Notification> {
    return this.rest.post<Notification>(`/notifications/${referenceNumber}/submit`);
  }

  async amendNotification(referenceNumber: string): Promise<Notification> {
    return this.rest.post<Notification>(`/notifications/${referenceNumber}/amend`);
  }

  async softDeleteNotification(referenceNumber: string): Promise<Notification> {
    return this.rest.post<Notification>(`/notifications/${referenceNumber}/soft-delete`);
  }
}
