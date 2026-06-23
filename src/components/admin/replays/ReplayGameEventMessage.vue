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
import { EReplayGameEventType, EReplayLeaveReason } from "@/store/admin/types";

// Maps a LeaveReason enum value to the short suffix shown after "left the game".
const LEAVE_REASON_LABELS: Partial<Record<EReplayLeaveReason, string>> = {
  [EReplayLeaveReason.DISCONNECT]: "disconnected",
  [EReplayLeaveReason.LOST]: "lost",
  [EReplayLeaveReason.LOST_BUILDINGS]: "all buildings destroyed",
  [EReplayLeaveReason.WON]: "won",
  [EReplayLeaveReason.DRAW]: "draw",
  [EReplayLeaveReason.OBSERVER]: "observer",
  [EReplayLeaveReason.INVALID_SAVE_GAME]: "invalid save game",
  [EReplayLeaveReason.LOBBY]: "left lobby",
};

export default defineComponent({
  name: "ReplayGameEventMessage",
  props: {
    time: { type: Number, required: true },
    type: { type: Number as PropType<EReplayGameEventType>, required: true },
    playerName: { type: String, required: true },
    leaveReason: { type: String as PropType<EReplayLeaveReason>, required: false, default: undefined },
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
        case EReplayGameEventType.LEAVE: {
          const label = props.leaveReason === undefined ? undefined : LEAVE_REASON_LABELS[props.leaveReason];
          return label
            ? `${props.playerName} left the game (${label})`
            : `${props.playerName} left the game`;
        }
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
