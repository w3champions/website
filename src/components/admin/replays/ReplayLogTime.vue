<template>
  <span class="replay-log-time mr-2" :class="colorClass" :title="title">[{{ label }}]</span>
</template>

<script lang="ts">
import { computed, defineComponent, inject, ref, Ref } from "vue";
import { GAME_TIME_COLOR, REAL_TIME_COLOR, REPLAY_SHOW_REAL_TIME } from "@/components/admin/replays/replayTime";

export default defineComponent({
  name: "ReplayLogTime",
  props: {
    // Real elapsed time in ms (advances during pauses).
    time: { type: Number, required: true },
    // In-game clock in ms (frozen during pauses).
    gameTime: { type: Number, required: true },
  },
  setup(props) {
    // Toggled by the switch at the top of the chat log. Defaults to in-game time.
    const showRealTime = inject<Ref<boolean>>(REPLAY_SHOW_REAL_TIME, ref(false));

    const label = computed(() => formatTime(showRealTime.value ? props.time : props.gameTime));
    const title = computed(() => (showRealTime.value ? "Real time" : "In-game time"));
    const colorClass = computed(() => `text-${showRealTime.value ? REAL_TIME_COLOR : GAME_TIME_COLOR}`);

    // Example: 1500     -> 00:15
    // Example: 15000000 -> 04:10:00
    function formatTime(timeMs: number): string {
      const totalSeconds = Math.floor(timeMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (hours > 0) {
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      }

      return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    return { label, title, colorClass };
  },
});
</script>

<style scoped>
.replay-log-time {
  display: inline-block;
  width: 5rem;
  font-family: monospace;
  /* Mute the per-mode accent so the timestamps read as a subtle grey-ish tint
     rather than the bright label/switch colour. */
  opacity: 0.6;
}
</style>
