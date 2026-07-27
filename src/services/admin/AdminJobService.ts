import { API_URL } from "@/config/env";
import { authorizedFetch } from "@/helpers/general";
import { AdminJob } from "@/types/admin/AdminJob";

/** What the caller needs to tell apart, rather than a raw status code. */
export type AdminJobActionResult =
  | { ok: true; job: AdminJob }
  | { ok: false; reason: "conflict" | "forbidden" | "error"; message: string };

async function act(url: string, token: string): Promise<AdminJobActionResult> {
  const response = await authorizedFetch("POST", url, token);

  if (response.ok) {
    return { ok: true, job: await response.json() };
  }

  if (response.status === 409) {
    // Someone else started or stopped it between the page's last poll and the
    // click, so the button the admin pressed no longer applies.
    return { ok: false, reason: "conflict", message: "The job's state changed - refreshing." };
  }

  if (response.status === 401 || response.status === 403) {
    return { ok: false, reason: "forbidden", message: "You don't have permission to run this job." };
  }

  return { ok: false, reason: "error", message: `Request failed (${response.status}).` };
}

export default class AdminJobService {
  public static async getJobs(token: string): Promise<AdminJob[]> {
    const url = `${API_URL}api/admin/jobs`;
    const response = await authorizedFetch("GET", url, token);

    return response.ok ? await response.json() : [];
  }

  /**
   * @param force Run again even though the job already completed.
   * @param reset Discard the resume point and start from the beginning.
   */
  public static runJob(
    key: string,
    token: string,
    { force = false, reset = false } = {},
  ): Promise<AdminJobActionResult> {
    const query = new URLSearchParams();
    if (force) query.set("force", "true");
    if (reset) query.set("reset", "true");

    const suffix = query.toString() ? `?${query}` : "";
    return act(`${API_URL}api/admin/jobs/${encodeURIComponent(key)}/run${suffix}`, token);
  }

  public static cancelJob(key: string, token: string): Promise<AdminJobActionResult> {
    return act(`${API_URL}api/admin/jobs/${encodeURIComponent(key)}/cancel`, token);
  }
}
