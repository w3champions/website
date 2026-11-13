import { AuthorizedClient, type AuthorizedClientDeps, HttpError } from "@/services/http/AuthorizedClient";
import { serverMessageOf } from "./HardwareSmurfService";
import type { ManualEventRequest, RenameRequest, ReviewRequest, SmurfEventCreateResult, SmurfEventDenyPreview, SmurfEventDetail, SmurfEventHistory, SmurfEventIdentifiers, SmurfEventPreview, SmurfEventPreviewRequest, SmurfEventsPage, SmurfEventsQuery, SmurfEventWriteResponse } from "./smurf-detection/SmurfEventsResponse";

const BASE = "api/admin/smurf-detection/events";

/**
 * A refused or failed request. `serverMessage`: the text the server sent, null when it sent none we can read.
 * `body`: the parsed error body (a refused create carries its `preview`), null when it is not JSON.
 * `retryAfterSeconds`: how long the server asked to wait (a `Retry-After` header), whole seconds of at least 1, null when none.
 */
export class SmurfEventsApiError extends Error {
  readonly status: number;
  readonly serverMessage: string | null;
  readonly body: unknown;
  readonly retryAfterSeconds: number | null;

  constructor(status: number, serverMessage: string | null, body: unknown, retryAfterSeconds: number | null = null) {
    super(serverMessage ?? `HTTP ${status}`);
    this.name = "SmurfEventsApiError";
    this.status = status;
    this.serverMessage = serverMessage;
    this.body = body;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const MS_PER_SECOND = 1000;

/**
 * A `Retry-After` header as whole seconds of at least 1: delay-seconds, or an HTTP date measured from `nowMs`.
 * Null when absent, malformed or not in the future.
 */
export function retryAfterSecondsOf(header: string | null, nowMs: number): number | null {
  const text = header?.trim();
  if (!text) return null;
  const seconds = /^\d+$/.test(text) ? Number(text) : Math.ceil((Date.parse(text) - nowMs) / MS_PER_SECOND);
  return Number.isSafeInteger(seconds) && seconds >= 1 ? seconds : null;
}

function parsedOrNull(body: string): unknown {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

/** A create that matched an existing event answers 200 instead of 201. */
const EXISTING_STATUS = 200;

const segment = encodeURIComponent;

/**
 * Smurf event moderation (website-backend proxies these routes to matchmaking). Writes never send
 * an author: the backend sets it from the moderator's token.
 */
export class SmurfEventsService {
  private readonly client: AuthorizedClient;

  /** `now`: the clock for an HTTP-date `Retry-After`, injectable for tests. */
  constructor(deps: AuthorizedClientDeps, private readonly now: () => number = Date.now) {
    this.client = new AuthorizedClient(deps);
  }

  private async call<T>(method: string, path: string, token: string, body?: unknown): Promise<T> {
    try {
      return await this.client.requestJson<T>(method, `${BASE}${path}`, token, body);
    } catch (e) {
      throw asApiError(e, this.now());
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

  /** 201: created. 200: the same anchors and span were already stored, and that event came back unchanged. */
  async create(token: string, request: ManualEventRequest): Promise<SmurfEventCreateResult> {
    try {
      const { body, status } = await this.client.requestJsonWithStatus<SmurfEventWriteResponse>("POST", BASE, token, request);
      return { event: body, existing: status === EXISTING_STATUS };
    } catch (e) {
      throw asApiError(e, this.now());
    }
  }

  async update(token: string, id: string, request: ManualEventRequest): Promise<SmurfEventWriteResponse> {
    return await this.call("PUT", `/${segment(id)}`, token, request);
  }

  /** The reason is required by the page (it goes to the audit log). */
  async remove(token: string, id: string, reason: string): Promise<void> {
    try {
      await this.client.requestVoid("DELETE", `${BASE}/${segment(id)}`, token, { reason });
    } catch (e) {
      throw asApiError(e, this.now());
    }
  }

  async review(token: string, id: string, request: ReviewRequest): Promise<SmurfEventWriteResponse> {
    return await this.call("POST", `/${segment(id)}/review`, token, request);
  }

  async rename(token: string, id: string, request: RenameRequest): Promise<SmurfEventDetail> {
    return await this.call("POST", `/${segment(id)}/rename`, token, request);
  }

  /** No query: the server decides what the caller may see, so the page never asks to reveal anything. */
  async identifiers(token: string, id: string): Promise<SmurfEventIdentifiers> {
    return await this.call("GET", `/${segment(id)}/identifiers`, token);
  }

  async history(token: string, id: string): Promise<SmurfEventHistory> {
    return await this.call("GET", `/${segment(id)}/history`, token);
  }
}

function asApiError(e: unknown, nowMs: number): unknown {
  if (e instanceof HttpError) {
    return new SmurfEventsApiError(e.status, serverMessageOf(e.responseBody), parsedOrNull(e.responseBody), retryAfterSecondsOf(e.retryAfter, nowMs));
  }
  return e;
}
