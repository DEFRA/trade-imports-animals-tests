import { RestClient } from '@adapters/http/rest-client';
import { getBackendBaseUrl } from '@config/service-base-urls';
import type { Notification } from '@domain/models/api/notification';

export class NotificationApiClient {
  private readonly rest: RestClient;

  constructor(baseUrl: string = getBackendBaseUrl()) {
    this.rest = new RestClient(baseUrl);
  }

  /**
   * Creates a DRAFT notification; the backend mints and returns the
   * reference number. Any referenceNumber on the body is stripped, because
   * a body carrying one is treated as an update instead.
   */
  async createNotification(notification: Notification): Promise<Notification> {
    const body = { ...notification };
    delete body.referenceNumber;
    return this.rest.post<Notification>('/notifications', body);
  }

  /**
   * Full replace: fields omitted from the body are cleared on the stored
   * notification, mirroring how the frontend re-posts the whole payload.
   */
  async updateNotification(notification: Notification): Promise<Notification> {
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

  async copyNotification(referenceNumber: string): Promise<Notification> {
    return this.rest.post<Notification>(`/notifications/${referenceNumber}/copy`);
  }

  async softDeleteNotification(referenceNumber: string): Promise<Notification> {
    return this.rest.post<Notification>(`/notifications/${referenceNumber}/soft-delete`);
  }
}
