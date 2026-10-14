export interface ActionLatencyPoint {
  x: number;
  y: number | null;
}

// Mirrors ACTION_LATENCY_BUCKET_MS in flo's crates/types/src/match_telemetry.rs.
const BUCKET_MS = 1000;

/**
 * Buckets are one second of wall clock, so bucket i sits at matchStartMs + i * 1000.
 * gameTimeOffsetsMs is deliberately not used: game time freezes during a pause, which would
 * collapse the pause buckets onto one x and shift every later point early by the pause length.
 * Buckets in which nothing was echoed (a pause) (e.g. during a pause) have a zero count and become gaps.
 */
export function buildActionLatencyPoints(
  matchStartMs: number,
  meansMs: number[],
  sampleCounts: number[],
): ActionLatencyPoint[] {
  return meansMs.map((mean, i) => ({
    x: matchStartMs + i * BUCKET_MS,
    y: sampleCounts[i] > 0 ? mean : null,
  }));
}
