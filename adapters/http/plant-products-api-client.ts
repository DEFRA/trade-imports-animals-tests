import type { APIRequestContext } from '@playwright/test';
import { RestClient, RestClientError } from '@adapters/http/rest-client';
import { getBackendBaseUrl, getDeveloperApiKey } from '@config/service-base-urls';
import type {
  PlantProductsAccompanyingDocumentDto,
  PlantProductsAccompanyingDocumentListResponse,
  PlantProductsNotification,
  PlantProductsNotificationDto,
  PlantProductsNotificationPageResponse,
  PlantProductsNotificationResponse,
  PlantProductsStatusChangeRequest,
} from '@domain/plant-products/models/api/notification';

export type PlantProductsListParams = {
  page?: number;
  sort?: string;
  referenceNumber?: string;
};

export class PlantProductsApiClient {
  private readonly rest: RestClient;

  constructor(request: APIRequestContext, baseUrl: string = getBackendBaseUrl(), apiKey: string | undefined = getDeveloperApiKey()) {
    this.rest = new RestClient(baseUrl, request, apiKey);
  }

  // Unlike live animals' fulfilment plus two projections, plant products has one notification
  // resource. There are intentionally no replaceNotification/projection-seeding methods here.
  async create(): Promise<PlantProductsNotification> {
    return this.rest.post<PlantProductsNotification>('/plant-products/notifications', { referenceNumber: null });
  }

  async load(referenceNumber: string): Promise<PlantProductsNotificationResponse> {
    return this.rest.get<PlantProductsNotificationResponse>(`/plant-products/notifications/${referenceNumber}`);
  }

  async list(params: PlantProductsListParams = {}): Promise<PlantProductsNotificationPageResponse> {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      sort: params.sort ?? 'arrivalDate,desc',
    });
    if (params.referenceNumber) query.set('referenceNumber', params.referenceNumber);
    return this.rest.get<PlantProductsNotificationPageResponse>(`/plant-products/notifications?${query.toString()}`);
  }

  async has(referenceNumber: string): Promise<boolean> {
    try {
      await this.load(referenceNumber);
      return true;
    } catch (error) {
      if (error instanceof RestClientError && error.status === 404) return false;
      throw error;
    }
  }

  async replace(referenceNumber: string, body: PlantProductsNotificationDto): Promise<PlantProductsNotification> {
    return this.rest.put<PlantProductsNotification>(`/plant-products/notifications/${referenceNumber}`, {
      ...body,
      referenceNumber,
    });
  }

  async setStatus(referenceNumber: string, body: PlantProductsStatusChangeRequest): Promise<PlantProductsNotification> {
    return this.rest.put<PlantProductsNotification>(`/plant-products/notifications/${referenceNumber}/status`, body);
  }

  // Live animals puts idempotent copy on /fulfilments/{id}/copy. Plant products transposes the
  // pattern, not that path: copies belong to the notification resource and the backend key is global.
  async copy(referenceNumber: string, idempotencyKey: string): Promise<PlantProductsNotification> {
    return this.rest.post<PlantProductsNotification>(`/plant-products/notifications/${referenceNumber}/copies`, undefined, {
      'Idempotency-Key': idempotencyKey,
    });
  }

  async listDocuments(referenceNumber: string): Promise<PlantProductsAccompanyingDocumentListResponse> {
    return this.rest.get<PlantProductsAccompanyingDocumentListResponse>(
      `/plant-products/notifications/${referenceNumber}/accompanying-documents`,
    );
  }

  async addDocument(referenceNumber: string, body: PlantProductsAccompanyingDocumentDto): Promise<PlantProductsAccompanyingDocumentDto> {
    return this.rest.post<PlantProductsAccompanyingDocumentDto>(
      `/plant-products/notifications/${referenceNumber}/accompanying-documents`,
      body,
    );
  }

  async replaceDocument(
    referenceNumber: string,
    documentId: string,
    body: PlantProductsAccompanyingDocumentDto,
  ): Promise<PlantProductsAccompanyingDocumentDto> {
    return this.rest.put<PlantProductsAccompanyingDocumentDto>(
      `/plant-products/notifications/${referenceNumber}/accompanying-documents/${documentId}`,
      body,
    );
  }

  async deleteDocument(referenceNumber: string, documentId: string): Promise<void> {
    await this.rest.delete<void>(`/plant-products/notifications/${referenceNumber}/accompanying-documents/${documentId}`);
  }
}
