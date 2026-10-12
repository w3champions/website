import { API_URL } from "@/config/env";
import { AuthorizedClient } from "@/services/http/AuthorizedClient";
import { EGameMode } from "@/store/types";
import { ReplayExportFilter, ReplayExportMatch, ReplayExportOptions, ReplayExportPreview, ReplayExportSummary, ReplayExportTicket } from "@/store/admin/replayExport/types";

const BASE = "api/admin/replay-export";

/** Errors are HttpError; replayExportError (store/admin/replayExport/errors.ts) gives their text. */
const client = new AuthorizedClient({ endpoint: API_URL });

export default class ReplayExportService {
  public static async getOptions(token: string, gameMode: EGameMode): Promise<ReplayExportOptions> {
    return await client.getJson(`${BASE}/options?gameMode=${gameMode}`, token);
  }

  public static async preview(token: string, filter: ReplayExportFilter): Promise<ReplayExportPreview> {
    return await client.requestJson("POST", `${BASE}/preview`, token, filter);
  }

  /** The games of one table page, in the order of `matchIds` (at most 250). */
  public static async matches(token: string, matchIds: string[]): Promise<ReplayExportMatch[]> {
    return await client.requestJson("POST", `${BASE}/matches`, token, { matchIds });
  }

  public static async createTicket(
    token: string,
    matchIds: string[],
    filter: ReplayExportFilter | null,
    label: string,
    description: string,
  ): Promise<ReplayExportTicket> {
    return await client.requestJson("POST", `${BASE}/tickets`, token, { matchIds, filter, label, description });
  }

  /** A repeat download of a past download: the server builds the same ZIP again. */
  public static async createRepeatTicket(token: string, exportId: string): Promise<ReplayExportTicket> {
    return await client.requestJson("POST", `${BASE}/exports/${encodeURIComponent(exportId)}/tickets`, token);
  }

  /** The past downloads of the signed-in user. */
  public static async getExports(token: string): Promise<ReplayExportSummary[]> {
    return await client.getJson(`${BASE}/exports`, token);
  }

  /** For admins: the downloads of all users. */
  public static async getAllExports(token: string): Promise<ReplayExportSummary[]> {
    return await client.getJson(`${BASE}/all-exports`, token);
  }

  /** For admins: a repeat download of any user's download. */
  public static async createAdminRepeatTicket(token: string, exportId: string): Promise<ReplayExportTicket> {
    return await client.requestJson("POST", `${BASE}/all-exports/${encodeURIComponent(exportId)}/tickets`, token);
  }

  /** A plain GET, so the browser streams the ZIP to disk. The single-use ticket authorizes it. */
  public static downloadUrl(ticket: string): string {
    return `${API_URL}${BASE}/download/${encodeURIComponent(ticket)}`;
  }
}
