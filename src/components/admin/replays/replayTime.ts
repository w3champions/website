import type { InjectionKey, Ref } from "vue";

// Shared across the replay chat log rows: true = show real time, false = in-game time.
// Provided by AdminReplayChatLogMessages (the toggle), injected by ReplayLogTime.
export const REPLAY_SHOW_REAL_TIME: InjectionKey<Ref<boolean>> = Symbol("replayShowRealTime");

// Per-mode accent colour (Vuetify colour name). Used bright for the active toggle
// label and the switch, and muted (lower opacity) for the timestamps, so a cropped
// screenshot reveals the active mode. Prefix with "text-" for a text-colour class.
export const GAME_TIME_COLOR = "w3-gold";
export const REAL_TIME_COLOR = "light-blue";

// Format a pause duration (ms) as a short human string: "38s", "1m 5s".
export function formatPauseDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
}
