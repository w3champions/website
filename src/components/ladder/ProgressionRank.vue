<template>
  <div class="progression-rank">
    <league-icon :league="progression.league" />
    <span v-if="isApex" class="progression-rank__apex number-text">{{ progression.apexPoints }}</span>
    <v-progress-linear
      v-else
      class="progression-rank__bar"
      :model-value="progression.points"
      :max="100"
      height="25"
      color="level-progress-gradient"
    >
      <strong>{{ progression.division }} · {{ progression.points }}</strong>
    </v-progress-linear>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from "vue";
import type { ProgressionRank as ProgressionRankType } from "@/store/ranking/types";
import LeagueIcon from "@/components/ladder/LeagueIcon.vue";
import { isApexRank } from "@/helpers/progression-rank";

export default defineComponent({
  name: "ProgressionRank",
  components: {
    LeagueIcon,
  },
  props: {
    progression: {
      type: Object as PropType<ProgressionRankType>,
      required: true,
    },
  },
  setup(props) {
    const isApex = computed<boolean>(() => isApexRank(props.progression));
    return {
      isApex,
    };
  },
});
</script>

<style lang="scss" scoped>
.progression-rank {
  display: inline-flex;
  align-items: center;
}

.progression-rank__apex {
  margin-left: 4px;
  font-weight: 700;
}

.progression-rank__bar {
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
