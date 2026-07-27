/** Thrown when the backend answers with a non-OK status. */
export class HttpError extends Error {
  readonly status: number;
  readonly method: string;
  readonly url: string;
  /** Response body, truncated — useful context when a call fails in the wild. */
  readonly responseBody: string;

  constructor(status: number, method: string, url: string, responseBody: string) {
    super(`HTTP ${status} for ${method} ${url}`);
    this.name = "HttpError";
    this.status = status;
    this.method = method;
    this.url = url;
    this.responseBody = responseBody;
  }
}

export interface AuthorizedClientDeps {
  /** Backend base URL, e.g. API_URL. A trailing slash is optional. */
  endpoint: string;
  /** Injectable for tests. Production callers omit it. */
  fetch?: typeof globalThis.fetch;
}

const MAX_ERROR_BODY_CHARS = 500;

/**
 * Authenticated JSON client for the website backend.
 *
 * Exists so that URL joining, bearer auth, status checking and JSON parsing live
 * in one place instead of being re-implemented per service. The older
 * `authorizedFetch` helper returns a raw Response and leaves status handling to
 * each caller, which is applied inconsistently — some callers parse error bodies
 * as if they were success payloads, others swallow failures into empty defaults.
 * Prefer this client for new code and when touching an existing service.
 */
export class AuthorizedClient {
  private readonly endpoint: string;
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(deps: AuthorizedClientDeps) {
    this.endpoint = deps.endpoint.endsWith("/") ? deps.endpoint : `${deps.endpoint}/`;
    // Bind to the global. Storing the native fetch on an instance and calling it
    // as `this.fetchImpl(...)` passes this client as the receiver; Firefox
    // brand-checks that and throws "'fetch' called on an object that does not
    // implement interface Window", while Chromium allows it. Binding here keeps
    // that failure mode out of every service that uses this client.
    this.fetchImpl = deps.fetch ?? globalThis.fetch.bind(globalThis);
  }

  /** Absolute URL for a backend-relative path. */
  private resolve(path: string): string {
    return `${this.endpoint}${path.startsWith("/") ? path.slice(1) : path}`;
  }

  /** Raw request, for the rare caller that needs the Response itself. */
  async request(method: string, path: string, token: string, body?: unknown): Promise<Response> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    return await this.fetchImpl(this.resolve(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  /** Request and parse JSON, throwing {@link HttpError} on any non-OK status. */
  async requestJson<T>(method: string, path: string, token: string, body?: unknown): Promise<T> {
    const response = await this.request(method, path, token, body);
    if (!response.ok) {
      throw new HttpError(response.status, method, this.resolve(path), await readErrorBody(response));
    }
    return await response.json() as T;
  }

  async getJson<T>(path: string, token: string): Promise<T> {
    return await this.requestJson<T>("GET", path, token);
  }

  /**
   * As {@link getJson}, but maps 404 to null. Use only where "absent" is a normal
   * outcome rather than a failure — every other status still throws.
   */
  async getJsonOrNull<T>(path: string, token: string): Promise<T | null> {
    const response = await this.request("GET", path, token);
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new HttpError(response.status, "GET", this.resolve(path), await readErrorBody(response));
    }
    return await response.json() as T;
  }
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, MAX_ERROR_BODY_CHARS);
  } catch {
    // A body that cannot be read must not mask the status we are reporting.
    return "";
  }
}
