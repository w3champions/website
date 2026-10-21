import { AuthorizedClient, type AuthorizedClientDeps, HttpError } from "@/services/http/AuthorizedClient";
import type { AuditPage, AuditQuery, HardwareItemDetail, HardwareItemsResponse, HardwareLinksResponse, OverrideResult } from "./smurf-detection/HardwareSmurfResponse";

const BASE = "api/admin/smurf-detection";

/** A refused or failed request. `serverMessage`: the text the server sent, null when it sent none we can read. */
export class HardwareSmurfApiError extends Error {
  readonly status: number;
  readonly serverMessage: string | null;

  constructor(status: number, serverMessage: string | null) {
    super(serverMessage ?? `HTTP ${status}`);
    this.name = "HardwareSmurfApiError";
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

function nonEmpty(values: unknown[]): string | null {
  const texts = values.filter((v): v is string => typeof v === "string" && v.trim() !== "");
  return texts.length > 0 ? texts.join("; ") : null;
}

/**
 * The message of an error body: matchmaking's `errors[].msg` or `error`, an ASP.NET validation
 * body (`errors: { field: [..] }`) or a plain `message`. Null for anything else (HTML, empty).
 */
export function serverMessageOf(body: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const { errors, error, message } = parsed as Record<string, unknown>;
  if (Array.isArray(errors)) {
    const text = nonEmpty(errors.map((e) => (typeof e === "object" && e !== null ? (e as Record<string, unknown>).msg : undefined)));
    if (text) return text;
  } else if (typeof errors === "object" && errors !== null) {
    const text = nonEmpty(Object.values(errors).flatMap((v) => (Array.isArray(v) ? v : [v])));
    if (text) return text;
  }
  return nonEmpty([error]) ?? nonEmpty([message]);
}

const segment = encodeURIComponent;

/**
 * Hardware smurf moderation (website-backend proxies these routes to matchmaking). Writes send
 * only `reason`: the backend sets the author from the moderator's token. Every path segment is
 * encoded (battleTags contain `#`).
 */
export class HardwareSmurfService {
  private readonly client: AuthorizedClient;

  constructor(deps: AuthorizedClientDeps) {
    this.client = new AuthorizedClient(deps);
  }

  private async call<T>(method: string, path: string, token: string, body?: unknown): Promise<T> {
    try {
      return await this.client.requestJson<T>(method, `${BASE}/${path}`, token, body);
    } catch (e) {
      if (e instanceof HttpError) throw new HardwareSmurfApiError(e.status, serverMessageOf(e.responseBody));
      throw e;
    }
  }

  async getLinks(token: string, battleTag: string): Promise<HardwareLinksResponse> {
    return await this.call("GET", `hardware/links/${segment(battleTag)}`, token);
  }

  async getItems(token: string, battleTag: string): Promise<HardwareItemsResponse> {
    return await this.call("GET", `hardware/items/${segment(battleTag)}`, token);
  }

  async getItem(token: string, battleTag: string, hash8: string): Promise<HardwareItemDetail> {
    return await this.call("GET", `hardware/items/${segment(battleTag)}/${segment(hash8)}`, token);
  }

  async getAudit(token: string, query: AuditQuery): Promise<AuditPage> {
    const params: Array<[string, string | number | undefined]> = [["battleTag", query.battleTag], ["before", query.before], ["limit", query.limit]];
    const parts = params.filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
    return await this.call("GET", `hardware/audit${parts.length > 0 ? `?${parts.join("&")}` : ""}`, token);
  }

  async setSmurf(token: string, a: string, b: string, reason: string): Promise<OverrideResult> {
    return await this.call("POST", `${pairPath(a, b)}/smurf`, token, { reason });
  }

  async revokeSmurf(token: string, a: string, b: string): Promise<OverrideResult> {
    return await this.call("DELETE", `${pairPath(a, b)}/smurf`, token);
  }

  async setNotSmurf(token: string, a: string, b: string, reason: string): Promise<OverrideResult> {
    return await this.call("POST", `${pairPath(a, b)}/not-smurf`, token, { reason });
  }

  async revokeNotSmurf(token: string, a: string, b: string): Promise<OverrideResult> {
    return await this.call("DELETE", `${pairPath(a, b)}/not-smurf`, token);
  }

  async trustItem(token: string, battleTag: string, hash8: string, reason: string): Promise<OverrideResult> {
    return await this.call("POST", `${itemPath(battleTag, hash8)}/trust`, token, { reason });
  }

  async revokeTrust(token: string, battleTag: string, hash8: string): Promise<OverrideResult> {
    return await this.call("DELETE", `${itemPath(battleTag, hash8)}/trust`, token);
  }

  async ignoreItem(token: string, battleTag: string, hash8: string, reason: string): Promise<OverrideResult> {
    return await this.call("POST", `${itemPath(battleTag, hash8)}/ignore`, token, { reason });
  }

  async revokeIgnore(token: string, battleTag: string, hash8: string): Promise<OverrideResult> {
    return await this.call("DELETE", `${itemPath(battleTag, hash8)}/ignore`, token);
  }
}

function pairPath(a: string, b: string): string {
  return `links/${segment(a)}/${segment(b)}`;
}

function itemPath(battleTag: string, hash8: string): string {
  return `hardware/items/${segment(battleTag)}/${segment(hash8)}`;
}
