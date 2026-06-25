<template>
  <span class="replay-log-time text-medium-emphasis mr-2">
    <span :title="gameTime !== time ? 'In-game time (clock was paused)' : 'In-game time'">
      [{{ formatTime(gameTime) }}]
    </span>
    <span
      v-if="gameTime !== time"
      class="text-disabled ml-1"
      title="Real time (advances during pauses)"
    >{{ formatTime(time) }}</span>
  </span>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "ReplayLogTime",
  props: {
    // Real elapsed time in ms (advances during pauses).
    time: { type: Number, required: true },
    // In-game clock in ms (frozen during pauses).
    gameTime: { type: Number, required: true },
  },
  setup() {
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

    return { formatTime };
  },
});
</script>

<style scoped>
.replay-log-time {
  display: inline-block;
  width: 8.5rem;
  font-family: monospace;
}
</style>
