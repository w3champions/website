import { AuthorizedClient, type AuthorizedClientDeps, HttpError } from "@/services/http/AuthorizedClient";
import { AdminJob } from "@/types/admin/AdminJob";

/**
 * The outcomes the Jobs page has to tell apart, rather than a raw status code.
 * A conflict is an ordinary race - somebody started or stopped the job between
 * the page's last poll and the click - so it is a result here, not a thrown
 * error.
 */
export type AdminJobActionResult =
  | { ok: true; job: AdminJob }
  | { ok: false; reason: "conflict" | "forbidden" | "error"; message: string };

/**
 * Runs and reads the backend's admin jobs.
 *
 * Takes its endpoint (and optionally a fetch) rather than importing API_URL, so
 * it can be constructed in tests - `@/config/env` reads `window` at module load
 * and cannot be imported outside a browser.
 */
export class AdminJobService {
  private readonly client: AuthorizedClient;

  constructor(deps: AuthorizedClientDeps) {
    this.client = new AuthorizedClient(deps);
  }

  async getJobs(token: string): Promise<AdminJob[]> {
    return await this.client.getJson<AdminJob[]>("api/admin/jobs", token);
  }

  /**
   * @param force Run again even though the job already completed.
   * @param reset Discard the resume point and start from the beginning.
   */
  async runJob(
    key: string,
    token: string,
    { force = false, reset = false } = {},
  ): Promise<AdminJobActionResult> {
    const query = new URLSearchParams();
    if (force) query.set("force", "true");
    if (reset) query.set("reset", "true");

    const suffix = query.toString() ? `?${query}` : "";
    return await this.act("run", `${this.path(key, "run")}${suffix}`, token);
  }

  async cancelJob(key: string, token: string): Promise<AdminJobActionResult> {
    return await this.act("cancel", this.path(key, "cancel"), token);
  }

  private path(key: string, action: string): string {
    return `api/admin/jobs/${encodeURIComponent(key)}/${action}`;
  }

  private async act(action: string, path: string, token: string): Promise<AdminJobActionResult> {
    try {
      return { ok: true, job: await this.client.requestJson<AdminJob>("POST", path, token) };
    } catch (error) {
      if (!(error instanceof HttpError)) throw error;

      if (error.status === 409) {
        return { ok: false, reason: "conflict", message: "The job's state changed - refreshing." };
      }

      if (error.status === 401 || error.status === 403) {
        return { ok: false, reason: "forbidden", message: `You don't have permission to ${action} this job.` };
      }

      return { ok: false, reason: "error", message: `Request failed (${error.status}).` };
    }
  }
}
