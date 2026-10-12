import { API_URL } from "@/config/env";
import { AuthorizedClient } from "@/services/http/AuthorizedClient";
import { EGameMode } from "@/store/types";
import { ReplayExportFilter, ReplayExportMatch, ReplayExportOptions, ReplayExportPreview, ReplayExportSummary, ReplayExportTicket } from "@/store/admin/replayExport/types";

/** Errors are HttpError; replayExportError (store/admin/replayExport/errors.ts) gives their text. */
const client = new AuthorizedClient({ endpoint: API_URL });

/**
 * The search, the history and the download. The admin export (`api/admin/replay-export`, history
 * `exports`) and the replay store (`api/replay-store`, history `purchases`) have the same endpoints for them.
 */
export class ReplayExportApi {
  constructor(readonly base: string, private readonly historyPath: string) {}

  /** The store answers also without sign-in: then `token` is empty. */
  async getOptions(token: string, gameMode: EGameMode): Promise<ReplayExportOptions> {
    return await client.getJson(`${this.base}/options?gameMode=${gameMode}`, token);
  }

  async preview(token: string, filter: ReplayExportFilter): Promise<ReplayExportPreview> {
    return await client.requestJson("POST", `${this.base}/preview`, token, filter);
  }

  /** The games of one table page, in the order of `matchIds` (at most 250). */
  async matches(token: string, matchIds: string[]): Promise<ReplayExportMatch[]> {
    return await client.requestJson("POST", `${this.base}/matches`, token, { matchIds });
  }

  /** The past downloads (admin) or the purchases (store) of the signed-in user. */
  async getHistory(token: string): Promise<ReplayExportSummary[]> {
    return await client.getJson(`${this.base}/${this.historyPath}`, token);
  }

  /** A download of an entry of the history: the server builds the same ZIP again, at no cost. */
  async createHistoryTicket(token: string, exportId: string): Promise<ReplayExportTicket> {
    return await client.requestJson("POST", `${this.base}/${this.historyPath}/${encodeURIComponent(exportId)}/tickets`, token);
  }

  /** A plain GET, so the browser streams the ZIP to disk. The single-use ticket authorizes it. */
  downloadUrl(ticket: string): string {
    return `${API_URL}${this.base}/download/${encodeURIComponent(ticket)}`;
  }
}

export const adminReplayExportApi = new ReplayExportApi("api/admin/replay-export", "exports");

/** Admin only: free downloads, and the downloads of all users. */
export default class ReplayExportService {
  public static async createTicket(
    token: string,
    matchIds: string[],
    filter: ReplayExportFilter | null,
    label: string,
    description: string,
  ): Promise<ReplayExportTicket> {
    return await client.requestJson("POST", `${adminReplayExportApi.base}/tickets`, token, { matchIds, filter, label, description });
  }

  /** The downloads of all users. */
  public static async getAllExports(token: string): Promise<ReplayExportSummary[]> {
    return await client.getJson(`${adminReplayExportApi.base}/all-exports`, token);
  }

  /** A repeat download of any user's download. */
  public static async createAdminRepeatTicket(token: string, exportId: string): Promise<ReplayExportTicket> {
    return await client.requestJson("POST", `${adminReplayExportApi.base}/all-exports/${encodeURIComponent(exportId)}/tickets`, token);
  }
}
