<template>
  <v-container class="ma-0 pa-0">
    <div class="text-medium-emphasis font-italic">
      <span class="chat-time mr-2">[{{ formatTime(time) }}]</span>
      <span>{{ icon }} {{ description }}</span>
    </div>
  </v-container>
</template>

<script lang="ts">
import { computed, PropType, defineComponent } from "vue";
import { EReplayGameEventType } from "@/store/admin/types";

// Subset of W3GS LeaveReason codes worth distinguishing in the chat log.
const LEAVE_REASON_DISCONNECT = 0x01;

export default defineComponent({
  name: "ReplayGameEventMessage",
  props: {
    time: { type: Number, required: true },
    type: { type: Number as PropType<EReplayGameEventType>, required: true },
    playerName: { type: String, required: true },
    reason: { type: Number, required: false, default: undefined },
  },
  setup(props) {
    const icon = computed<string>(() => {
      switch (props.type) {
        case EReplayGameEventType.PAUSE:
          return "⏸";
        case EReplayGameEventType.RESUME:
          return "▶";
        case EReplayGameEventType.LEAVE:
          return "⬅";
        default:
          return "";
      }
    });

    const description = computed<string>(() => {
      switch (props.type) {
        case EReplayGameEventType.PAUSE:
          return `${props.playerName} paused the game`;
        case EReplayGameEventType.RESUME:
          return `${props.playerName} resumed the game`;
        case EReplayGameEventType.LEAVE:
          if (props.reason === LEAVE_REASON_DISCONNECT) {
            return `${props.playerName} left the game (disconnected)`;
          }
          return `${props.playerName} left the game`;
        default:
          return "";
      }
    });

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

    return {
      icon,
      description,
      formatTime,
    };
  },
});
</script>

<style scoped>
.chat-time {
  display: inline-block;
  width: 5rem;
  font-family: monospace;
}
</style>
