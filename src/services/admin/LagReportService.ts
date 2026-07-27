import { AuthorizedClient, type AuthorizedClientDeps } from "@/services/http/AuthorizedClient";
import { LagReportDetail, LagReportQueryParams, LagReportsResponse } from "@/store/admin/lagReports/types";

function buildQuery(params: LagReportQueryParams): string {
  const query = new URLSearchParams();
  query.set("page", params.page.toString());
  query.set("pageSize", params.pageSize.toString());

  if (params.battleTag) query.set("battleTag", params.battleTag);
  if (params.gameSearch) query.set("gameSearch", params.gameSearch);
  if (params.serverName) query.set("serverName", params.serverName);
  if (params.proxyName) query.set("proxyName", params.proxyName);
  if (params.proxyIp) query.set("proxyIp", params.proxyIp);
  if (params.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params.dateTo) query.set("dateTo", params.dateTo);
  if (params.issueCategory) query.set("issueCategory", params.issueCategory);
  if (params.explicitOnly) query.set("explicitOnly", "true");

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
}
