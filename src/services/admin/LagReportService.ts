import { AuthorizedClient, type AuthorizedClientDeps } from "@/services/http/AuthorizedClient";
import { LagReportAggregateParams, LagReportAggregateResponse, LagReportDetail, LagReportQueryParams, LagReportsResponse } from "@/store/admin/lagReports/types";

function setFilterParams(query: URLSearchParams, params: Omit<LagReportQueryParams, "page" | "pageSize">): void {
  if (params.battleTag) query.set("battleTag", params.battleTag);
  if (params.gameSearch) query.set("gameSearch", params.gameSearch);
  // List filters repeat their param — ASP.NET binds the repeats into one list, OR'd.
  for (const name of params.serverNames ?? []) query.append("serverName", name);
  for (const id of params.serverNodeIds ?? []) query.append("serverNodeId", id.toString());
  if (params.proxyName) query.set("proxyName", params.proxyName);
  if (params.proxyIp) query.set("proxyIp", params.proxyIp);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  for (const category of params.issueCategories ?? []) query.append("issueCategory", category);
  if (params.connectionIssueTag) query.set("connection_issue_tag", params.connectionIssueTag);
  if (params.explicitOnly) query.set("explicitOnly", "true");
  if (params.minPlayers) query.set("minPlayers", params.minPlayers.toString());
  if (params.maxPlayers) query.set("maxPlayers", params.maxPlayers.toString());
  if (params.minRepeat && params.minRepeat >= 2) {
    query.set("minRepeat", params.minRepeat.toString());
    // "submitted" is the server default; only the deviation goes on the wire.
    if (params.repeatMode === "involved") query.set("repeatMode", "involved");
  }
}

function buildQuery(params: LagReportQueryParams): string {
  const query = new URLSearchParams();
  query.set("page", params.page.toString());
  query.set("pageSize", params.pageSize.toString());
  setFilterParams(query, params);
  return query.toString();
}

function buildAggregateQuery(params: LagReportAggregateParams): string {
  const query = new URLSearchParams();
  query.set("groupBy", params.groupBy);
  if (params.limit !== undefined) query.set("limit", params.limit.toString());
  setFilterParams(query, params);
  return query.toString();
}

/**
 * Reads lag reports from the backend.
 *
 * Takes its endpoint (and optionally a fetch) rather than importing API_URL, so
 * it can be constructed in tests — `@/config/env` reads `window` at module load
 * and cannot be imported outside a browser.
 */
export class LagReportService {
  private readonly client: AuthorizedClient;

  constructor(deps: AuthorizedClientDeps) {
    this.client = new AuthorizedClient(deps);
  }

  async getReports(token: string, params: LagReportQueryParams): Promise<LagReportsResponse> {
    return await this.client.getJson<LagReportsResponse>(`api/lag-reports?${buildQuery(params)}`, token);
  }

  async getReport(token: string, id: string): Promise<LagReportDetail> {
    return await this.client.getJson<LagReportDetail>(`api/lag-reports/${encodeURIComponent(id)}`, token);
  }

  async getAggregate(token: string, params: LagReportAggregateParams): Promise<LagReportAggregateResponse> {
    return await this.client.getJson<LagReportAggregateResponse>(
      `api/lag-reports/aggregate?${buildAggregateQuery(params)}`,
      token,
    );
  }
}
