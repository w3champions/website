<template>
  <v-tooltip location="top" content-class="w3-tooltip elevation-1">
    <template v-slot:activator="{ props }">
      <td class="number-text text-right" :class="toWinClass" v-bind="props">
        {{ toWinText }}
      </td>
    </template>
    <div>
      <span class="number-text won">{{ stats.wins }}W</span>
      -
      <span class="number-text lost">{{ stats.losses }}L</span>
      &nbsp;&nbsp;
      {{ $t("common.total") }} <span class="number-text">{{ stats.games }}</span>
    </div>
  </v-tooltip>
</template>

<script lang="ts">
import { computed, PropType, defineComponent } from "vue";
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
    const toWinText = computed<string>(() => {
      if (isComparingSameRace.value || props.stats.games == 0) {
        return "-";
      }

      return `${(props.stats.winrate * 100).toFixed(1)}%`;
    });

    const toWinClass = computed<string[]>(() => {
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

    const isComparingSameRace = computed<boolean>(() => {
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
