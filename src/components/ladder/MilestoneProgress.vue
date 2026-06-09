<template>
  <v-progress-linear class="milestone-progress" :model-value="fillPercent" :max="100" height="25" color="level-progress-gradient">
    <strong>{{ milestoneProgress.currentWins }} / {{ milestoneProgress.nextTarget }}</strong>
  </v-progress-linear>
</template>

<script lang="ts">
import { defineComponent, computed, type PropType } from "vue";
import type { MilestoneProgress as MilestoneProgressType } from "@/store/ranking/types";

export default defineComponent({
  name: "MilestoneProgress",
  components: {},
  props: {
    milestoneProgress: {
      type: Object as PropType<MilestoneProgressType>,
      required: true,
    },
  },
  setup(props) {
    const fillPercent = computed<number>(() => {
      const { currentWins, previousTarget, nextTarget } = props.milestoneProgress;
      const span = nextTarget - previousTarget;
      if (span <= 0) return 100;
      return Math.min(100, Math.max(0, ((currentWins - previousTarget) / span) * 100));
    });

    return {
      fillPercent,
    };
  },
});
</script>

<style lang="scss" scoped>
.milestone-progress {
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.75);
  border-radius: 3px;
  min-width: 100px;
  max-width: 200px;
  text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white;

  :deep(.bg-level-progress-gradient) {
    background-image: linear-gradient(white 0%, rgb(var(--v-theme-primary)) 40%, rgb(var(--v-theme-primary)) 60%, white 100%);
  }

  .v-theme--nightelf &, .v-theme--undead & {
    background-color: black;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.7);
    text-shadow: -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black;

    :deep(.bg-level-progress-gradient) {
      background-image: linear-gradient(black, rgb(var(--v-theme-primary)), black);
    }
  }
}
</style>
