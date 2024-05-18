<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <td v-on="on" class="number-text" :class="toWinClass">
        {{ toWinText }}
      </td>
    </template>
    <div>
      {{ stats.wins }} - {{ stats.losses }}
    </div>
  </v-tooltip>
</template>

<script lang="ts">
import { computed, ComputedRef, PropType, defineComponent } from "vue";
import isNil from "lodash/isNil";
import { RaceWinLoss } from "@/store/overallStats/types";
import { ERaceEnum } from "@/store/types";

export default defineComponent({
  name: "PlayerStatsRaceVersusRaceOnMapTableCell",
  components: {},
  props: {
    stats: {
      type: Object as PropType<RaceWinLoss>,
      required: true,
    },
    compareRace: {
      type: Number as PropType<ERaceEnum>,
      required: false,
      default: undefined,
    },
    winThreshold: {
      type: Number,
      required: false,
      default: undefined,
    },
    lossThreshold: {
      type: Number,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    const toWinText: ComputedRef<string> = computed((): string => {
      if (isComparingSameRace.value || props.stats.games == 0) {
        return "-";
      }

      return `${(props.stats.winrate * 100).toFixed(1)}%`;
    });

    const toWinClass: ComputedRef<string[]> = computed((): string[] => {
      const classes: string[] = [];

      if (props.stats.games == 0 || isComparingSameRace.value) {
        classes.push("stats-empty");
        return classes;
      }

      if (props.stats.winrate > (props.winThreshold || 0.6)) {
        classes.push("won");
      }
      if (props.stats.winrate < (props.lossThreshold || 0.4)) {
        classes.push("lost");
      }

      return classes;
    });

    const isComparingSameRace: ComputedRef<boolean> = computed((): boolean => {
      // We must explicitly check nil here because compareRace could be RANDOM and !0 is true
      if (isNil(props.compareRace) || !props.stats) {
        return false;
      }

      return props.stats.race === props.compareRace;
    });

    return {
      toWinClass,
      toWinText,
    };
  },
});
</script>

<style lang="scss" scoped>
.stats-empty {
  padding-left: 30px;
}
</style>
