export interface TelemetryNotice {
  type: "error" | "warning" | "info";
  text: string;
}

export interface TelemetryNoticeInput {
  loading: boolean;
  error: string | null;
  /** False when no request was issued at all (see the store's `skip` action). */
  attempted: boolean;
  hasTelemetry: boolean;
}

/**
 * Explain why action-latency traces are missing from a lag report.
 *
 * Action latency arrives via a second request (player-match-telemetry) that is
 * independent of the lag report itself. Every failure of that request used to
 * render identically to "this game has no action latency", which makes a broken
 * request indistinguishable from absent data. Each state gets its own message.
 */
export function telemetryNoticeFor(state: TelemetryNoticeInput): TelemetryNotice | null {
  if (state.loading) return null;

  if (state.error) {
    return {
      type: state.attempted ? "error" : "warning",
      text: `Action-latency telemetry unavailable: ${state.error}`,
    };
  }

  if (state.attempted && !state.hasTelemetry) {
    return { type: "info", text: "No action-latency telemetry was recorded for this game." };
  }

  return null;
}
