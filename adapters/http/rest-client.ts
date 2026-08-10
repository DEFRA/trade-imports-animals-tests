import type { APIRequestContext } from '@playwright/test';

export class RestClientError extends Error {
  constructor(
    readonly status: number,
    readonly method: string,
    readonly url: string,
    readonly responseBody: string,
  ) {
    super(`${method} ${url} responded ${status}: ${responseBody}`);
    this.name = 'RestClientError';
  }
}

export class RestClient {
  constructor(
    private readonly baseUrl: string,
    private readonly request: APIRequestContext,
    private readonly apiKey?: string,
  ) {}

  async get<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.send<T>('GET', path, undefined, headers);
  }

  async post<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.send<T>('POST', path, body, headers);
  }

  async put<T>(path: string, body: unknown, headers?: Record<string, string>): Promise<T> {
    return this.send<T>('PUT', path, body, headers);
  }

  async delete<T = void>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.send<T>('DELETE', path, undefined, headers);
  }

  private async send<T>(method: string, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.request.fetch(url, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(this.apiKey ? { 'x-api-key': this.apiKey } : {}),
        ...headers,
      },
      data: body,
    });
    const responseBody = await response.text();

    if (!response.ok()) {
      throw new RestClientError(response.status(), method, url, responseBody);
    }

    return (responseBody ? JSON.parse(responseBody) : undefined) as T;
  }
}
