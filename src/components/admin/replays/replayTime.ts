import type { InjectionKey, Ref } from "vue";

// Shared across the replay chat log rows: true = show real time, false = in-game time.
// Provided by AdminReplayChatLogMessages (the toggle), injected by ReplayLogTime.
export const REPLAY_SHOW_REAL_TIME: InjectionKey<Ref<boolean>> = Symbol("replayShowRealTime");

// Format a pause duration (ms) as a short human string: "38s", "1m 5s".
export function formatPauseDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
}
