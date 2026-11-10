import { AuthorizedClient, type AuthorizedClientDeps, HttpError } from "@/services/http/AuthorizedClient";
import { serverMessageOf } from "./HardwareSmurfService";
import type { ManualEventRequest, ReviewRequest, SmurfEventDenyPreview, SmurfEventDetail, SmurfEventPreview, SmurfEventPreviewRequest, SmurfEventsPage, SmurfEventsQuery } from "./smurf-detection/SmurfEventsResponse";

const BASE = "api/admin/smurf-detection/events";

/**
 * A refused or failed request. `serverMessage`: the text the server sent, null when it sent none we can read.
 * `body`: the parsed error body (a refused create carries its `preview`), null when it is not JSON.
 */
export class SmurfEventsApiError extends Error {
  readonly status: number;
  readonly serverMessage: string | null;
  readonly body: unknown;

  constructor(status: number, serverMessage: string | null, body: unknown) {
    super(serverMessage ?? `HTTP ${status}`);
    this.name = "SmurfEventsApiError";
    this.status = status;
    this.serverMessage = serverMessage;
    this.body = body;
  }
}

function parsedOrNull(body: string): unknown {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

const segment = encodeURIComponent;

/**
 * Smurf event moderation (website-backend proxies these routes to matchmaking). Writes never send
 * an author: the backend sets it from the moderator's token.
 */
export class SmurfEventsService {
  private readonly client: AuthorizedClient;

  constructor(deps: AuthorizedClientDeps) {
    this.client = new AuthorizedClient(deps);
  }

  private async call<T>(method: string, path: string, token: string, body?: unknown): Promise<T> {
    try {
      return await this.client.requestJson<T>(method, `${BASE}${path}`, token, body);
    } catch (e) {
      throw asApiError(e);
    }
  }

  async list(token: string, query: SmurfEventsQuery): Promise<SmurfEventsPage> {
    const params: Array<[string, string | number | undefined]> = [["review", query.review], ["origin", query.origin], ["cursor", query.cursor], ["limit", query.limit]];
    const parts = params.filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
    return await this.call("GET", parts.length > 0 ? `?${parts.join("&")}` : "", token);
  }

  async get(token: string, id: string): Promise<SmurfEventDetail> {
    return await this.call("GET", `/${segment(id)}`, token);
  }

  async denyPreview(token: string, id: string): Promise<SmurfEventDenyPreview> {
    return await this.call("GET", `/${segment(id)}/deny-preview`, token);
  }

  async preview(token: string, request: SmurfEventPreviewRequest): Promise<SmurfEventPreview> {
    return await this.call("POST", "/preview", token, request);
  }

  async create(token: string, request: ManualEventRequest): Promise<SmurfEventDetail> {
    return await this.call("POST", "", token, request);
  }

  async update(token: string, id: string, request: ManualEventRequest): Promise<SmurfEventDetail> {
    return await this.call("PUT", `/${segment(id)}`, token, request);
  }

  /** The reason is required by the page (it goes to the audit log). */
  async remove(token: string, id: string, reason: string): Promise<void> {
    try {
      await this.client.requestVoid("DELETE", `${BASE}/${segment(id)}`, token, { reason });
    } catch (e) {
      throw asApiError(e);
    }
  }

  async review(token: string, id: string, request: ReviewRequest): Promise<SmurfEventDetail> {
    return await this.call("POST", `/${segment(id)}/review`, token, request);
  }
}

function asApiError(e: unknown): unknown {
  if (e instanceof HttpError) return new SmurfEventsApiError(e.status, serverMessageOf(e.responseBody), parsedOrNull(e.responseBody));
  return e;
}
