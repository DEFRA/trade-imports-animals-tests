import type { APIRequestContext, APIResponse } from '@playwright/test';

/** A page's form fields. An array posts the key repeatedly, the way a checkbox group does. */
export type FormFields = Record<string, string | string[]>;

export class FrontendFormError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
    readonly responseBody: string,
  ) {
    super(`POST ${path} responded ${status} instead of a redirect. Body:\n${responseBody}`);
    this.name = 'FrontendFormError';
  }
}

const HTTP_STATUS_OK = 200;
const HTTP_STATUS_MULTIPLE_CHOICES = 300;
const HTTP_STATUS_BAD_REQUEST = 400;

/** Enough of a re-render to read the error summary out of, without dumping a whole page. */
const BODY_EXCERPT_LENGTH = 2000;

const isRedirect = (response: APIResponse): boolean =>
  response.status() >= HTTP_STATUS_MULTIPLE_CHOICES && response.status() < HTTP_STATUS_BAD_REQUEST;

const encode = (fields: FormFields): string => {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(fields)) {
    for (const one of Array.isArray(value) ? value : [value]) {
      params.append(name, one);
    }
  }
  return params.toString();
};

/**
 * Posts a frontend page's form the way the browser does — url-encoded, with the
 * CSRF crumb, following no redirects.
 *
 * A page that rejects its payload answers 400, or re-renders 200 with an error
 * summary; only a save answers 3xx. So the redirect is the assertion: a step
 * that quietly failed validation would otherwise leave a half-filled
 * notification behind, which is the bug class this seeding exists to remove.
 */
export class FrontendFormClient {
  private crumb: string | undefined;

  constructor(private readonly request: APIRequestContext) {}

  /**
   * @hapi/crumb in its default (non-restful) mode compares `payload.crumb` to
   * the `crumb` cookie, and mints the cookie on any GET it does not skip. One
   * GET per context is enough — the cookie is reused for the context's life.
   *
   * The same GET proves the session. An unauthenticated dashboard answers 302
   * to /auth/sign-in, and every later post would answer 302 as well — passing
   * the redirect assertion while seeding nothing. Refusing anything but a 200
   * here is what stops a signed-out context looking like a successful seed.
   */
  private async crumbToken(): Promise<string> {
    if (this.crumb) {
      return this.crumb;
    }

    const landing = await this.request.get('/', { maxRedirects: 0 });
    if (landing.status() !== HTTP_STATUS_OK) {
      throw new Error(
        `GET / answered ${landing.status()} (${landing.headers()['location'] ?? 'no Location'}) instead of the dashboard. ` +
          'The seed context is not signed in to the frontend, so no post would reach a page.',
      );
    }

    const { cookies } = await this.request.storageState();
    const minted = cookies.find((cookie) => cookie.name === 'crumb')?.value;
    if (!minted) {
      throw new Error('GET / minted no "crumb" cookie, so no form post can pass CSRF validation.');
    }

    this.crumb = minted;
    return minted;
  }

  /** Posts the form and returns the Location it redirects to. */
  async postForm(path: string, fields: FormFields = {}): Promise<string> {
    const response = await this.request.post(path, {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      data: encode({ ...fields, crumb: await this.crumbToken() }),
      maxRedirects: 0,
    });

    if (!isRedirect(response)) {
      throw new FrontendFormError(response.status(), path, (await response.text()).slice(0, BODY_EXCERPT_LENGTH));
    }

    const location = response.headers()['location'];
    if (!location) {
      throw new Error(`POST ${path} redirected with no Location header, so there is no next page to follow.`);
    }
    return location;
  }
}
