import { LAUNCHER_UPDATE_URL } from "@/config/env";
import type { DetectedSource } from "@/components/setup-guides/launcherDownloadSource";
import { fetchWithTimeout } from "./http/fetchWithTimeout";

const DETECT_TIMEOUT_MS = 3000;

export default class LauncherDownloadSourceService {
  /**
   * Which download source the update service picks for this visitor. Null when it
   * cannot be told (offline, timeout, unexpected answer): the page then keeps
   * working with the service deciding at click time.
   */
  public static async fetchDetected(): Promise<DetectedSource | null> {
    try {
      return await fetchWithTimeout<DetectedSource | null>(
        `${LAUNCHER_UPDATE_URL}launcher-e/source`,
        { cache: "no-store" },
        { timeoutMs: DETECT_TIMEOUT_MS, describe: "Detecting the download source" },
        async (response) => {
          if (!response.ok) return null;
          const body = await response.json() as { detected?: unknown };
          return body.detected === "cn" || body.detected === "global" ? body.detected : null;
        },
      );
    } catch {
      return null;
    }
  }
}
