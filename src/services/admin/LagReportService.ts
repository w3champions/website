import { API_URL } from "@/main";
import { authorizedFetch } from "@/helpers/general";
import { LagReportDetail, LagReportQueryParams, LagReportsResponse } from "@/store/admin/lagReports/types";

export default class LagReportService {
  public static async getReports(token: string, params: LagReportQueryParams): Promise<LagReportsResponse> {
    const query = new URLSearchParams();
    query.set("page", params.page.toString());
    query.set("pageSize", params.pageSize.toString());

    if (params.battleTag) query.set("battleTag", params.battleTag);
    if (params.gameId != null) query.set("gameId", params.gameId.toString());
    if (params.serverNodeId != null) query.set("serverNodeId", params.serverNodeId.toString());
    if (params.proxyName) query.set("proxyName", params.proxyName);
    if (params.proxyIp) query.set("proxyIp", params.proxyIp);
    if (params.dateFrom) query.set("dateFrom", params.dateFrom);
    if (params.dateTo) query.set("dateTo", params.dateTo);
    if (params.issueCategory) query.set("issueCategory", params.issueCategory);
    if (params.explicitOnly) query.set("explicitOnly", "true");

    const url = `${API_URL}api/lag-reports?${query.toString()}`;
    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }

  public static async getReport(token: string, id: string): Promise<LagReportDetail> {
    const url = `${API_URL}api/lag-reports/${encodeURIComponent(id)}`;
    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }
}
