import { API_URL } from "@/config/env";
import { AuthorizedClient, HttpError } from "@/services/http/AuthorizedClient";
import type { AccountLookupResponse, AccountView, BanListQuery, BanListResponse, BanView, CreateBanRequest, EditBanRequest, MachineIdAccountsResponse, MachineIdRow, MachineImpactResponse, TagStatus } from "@/store/admin/bans/types";
import { banApiErrorOf } from "./banApiError";

export { BanApiError } from "./banApiError";

const BASE = "api/admin/bans";
const segment = encodeURIComponent;

function queryString(params: Array<[string, string | number | boolean | undefined]>): string {
  const parts = params.filter(([, value]) => value !== undefined).map(([name, value]) => `${name}=${encodeURIComponent(String(value))}`);
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

/** One request; an HTTP refusal becomes a BanApiError, anything else (network) is rethrown unchanged. */
async function call<T>(method: string, path: string, token: string, body?: unknown): Promise<T> {
  const client = new AuthorizedClient({ endpoint: API_URL });
  try {
    return await client.requestJson<T>(method, `${BASE}${path}`, token, body);
  } catch (e) {
    if (e instanceof HttpError) throw banApiErrorOf(e.status, e.responseBody);
    throw e;
  }
}

/**
 * Account-based bans (website-backend proxies these routes to matchmaking). Writes never carry
 * `actor` or `machineAccess`: the backend sets both from the token.
 */
export class BanAdminService {
  static list(query: BanListQuery, token: string): Promise<BanListResponse> {
    const params: Array<[string, string | number | boolean | undefined]> = [
      ["status", query.status],
      ["author", query.author],
      ["account", query.account],
      ["machineOnly", query.machineOnly],
      ["sort", query.sort],
      ["dir", query.dir],
      ["page", query.page],
      ["pageSize", query.pageSize],
    ];
    return call("GET", queryString(params), token);
  }

  static async authors(token: string): Promise<string[]> {
    return (await call<{ authors: string[] }>("GET", "/authors", token)).authors;
  }

  static lookup(q: string, token: string): Promise<AccountLookupResponse> {
    return call("GET", `/account-lookup${queryString([["q", q]])}`, token);
  }

  static account(accountKey: string, token: string): Promise<AccountView> {
    return call("GET", `/accounts/${segment(accountKey)}`, token);
  }

  static create(request: CreateBanRequest, token: string): Promise<BanView> {
    return call("POST", "", token, request);
  }

  static edit(banId: string, request: EditBanRequest, token: string): Promise<BanView> {
    return call("PATCH", `/${segment(banId)}`, token, request);
  }

  static revoke(banId: string, note: string, token: string): Promise<BanView> {
    return call("POST", `/${segment(banId)}/revoke`, token, { note });
  }

  static async machineIds(accountKey: string, token: string): Promise<MachineIdRow[]> {
    return (await call<{ machineIds: MachineIdRow[] }>("GET", `/accounts/${segment(accountKey)}/machine-ids`, token)).machineIds;
  }

  static machineIdAccounts(machineId: string, excludeAccount: string, token: string): Promise<MachineIdAccountsResponse> {
    return call("GET", `/machine-ids/${segment(machineId)}/accounts${queryString([["excludeAccount", excludeAccount]])}`, token);
  }

  static machineImpact(accountKey: string, machineIds: string[], token: string): Promise<MachineImpactResponse> {
    return call("POST", "/machine-impact", token, { accountKey, machineIds });
  }

  static async status(battleTags: string[], token: string): Promise<TagStatus[]> {
    return (await call<{ statuses: TagStatus[] }>("POST", "/status", token, { battleTags })).statuses;
  }
}
