<template>
  <v-container class="ma-0 pa-0">
    <div class="text-medium-emphasis font-italic">
      <replay-log-time :time="time" :game-time="gameTime" />
      <span>{{ icon }} {{ description }}</span>
    </div>
  </v-container>
</template>

<script lang="ts">
import { computed, PropType, defineComponent } from "vue";
import { EReplayGameEventType, EReplayLeaveReason } from "@/store/admin/types";
import ReplayLogTime from "@/components/admin/replays/ReplayLogTime.vue";
import { formatPauseDuration } from "@/components/admin/replays/replayTime";

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
  components: { ReplayLogTime },
  props: {
    time: { type: Number, required: true },
    gameTime: { type: Number, required: true },
    type: { type: Number as PropType<EReplayGameEventType>, required: true },
    playerName: { type: String, required: true },
    leaveReason: { type: String as PropType<EReplayLeaveReason>, required: false, default: undefined },
    // Real-time duration (ms) of the pause this resume ends; undefined otherwise.
    pauseDurationMs: { type: Number, required: false, default: undefined },
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
          return props.pauseDurationMs !== undefined
            ? `${props.playerName} resumed the game (paused ${formatPauseDuration(props.pauseDurationMs)})`
            : `${props.playerName} resumed the game`;
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

    return {
      icon,
      description,
    };
  },
});
</script>
