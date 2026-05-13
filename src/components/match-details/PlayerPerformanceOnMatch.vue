<template>
  <div>
    <v-row dense :class="left ? 'justify-end' : 'justify-start'">
      <v-col :order="left ? 1 : 3" cols="auto" :style="{ 'text-align': alignText }">
        <v-row dense>
          <v-col>{{ $t("components_match-details_playerperformanceonmatch.unitskilled") }}</v-col>
        </v-row>
        <v-row dense>
          <v-col>{{ $t("components_match-details_playerperformanceonmatch.unitsproduced") }}</v-col>
        </v-row>
        <v-row dense>
          <v-col>{{ $t("components_match-details_playerperformanceonmatch.goldmined") }}</v-col>
        </v-row>
        <v-row dense>
          <v-col>{{ $t("components_match-details_playerperformanceonmatch.lumbermined") }}</v-col>
        </v-row>
        <v-row dense>
          <v-col>{{ $t("components_match-details_playerperformanceonmatch.upkeeplost") }}</v-col>
        </v-row>
        <v-row dense>
          <v-col>{{ $t("components_match-details_playerperformanceonmatch.largestarmy") }}</v-col>
        </v-row>
      </v-col>
      <v-col :order="1" cols="1" />
      <v-col
        cols="auto"
        :order="left ? 3 : 0"
        :style="{ 'text-align': alignText }"
      >
        <v-row dense>
          <v-col :class="unitsKilledComparison">
            <number-display :object="unitScore" value="unitsKilled" :align="alignText" />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :class="unitsProducedComparison">
            <number-display :object="unitScore" value="unitsProduced" :align="alignText" />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :class="goldComparison">
            <number-display :object="resourceScore" value="goldCollected" :align="alignText" />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :class="woodComparison">
            <number-display :object="resourceScore" value="lumberCollected" :align="alignText" />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :class="upkeepComparison">
            <number-display :object="resourceScore" value="goldUpkeepLost" :align="alignText" />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :class="armyComparison">
            <number-display :object="unitScore" value="largestArmy" :delimiter="AddValuesDelimiter.SLASH" :align="alignText" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from "vue";
import { ResourceScore, UnitScore } from "@/store/types";
import NumberDisplay from "./NumberDisplay.vue";

export enum AddValuesDelimiter {
  PLUS = " + ",
  SLASH = " / ",
}

export default defineComponent({
  name: "PlayerPerformanceOnMatch",
  components: {
    NumberDisplay,
  },
  props: {
    unitScore: {
      type: Array<UnitScore>,
      required: false,
      default: [],
    },
    resourceScore: {
      type: Array<ResourceScore>,
      required: false,
      default: [],
    },
    unitScoreOpponent: {
      type: Array<UnitScore>,
      required: false,
      default: [],
    },
    resourceScoreOpponent: {
      type: Array<ResourceScore>,
      required: false,
      default: [],
    },
    left: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const alignText = ref<"right" | "left">(props.left ? "right" : "left");

    const goldComparison = computed<string>(() => {
      return comparison(
        props.resourceScoreOpponent
          .map((s) => s?.goldCollected ?? 0)
          .reduce((a, b) => a + b, 0),
        props.resourceScore.map((s) => s?.goldCollected ?? 0).reduce((a, b) => a + b, 0)
      );
    });

    const woodComparison = computed<string>(() => {
      return comparison(
        props.resourceScoreOpponent
          .map((s) => s?.lumberCollected ?? 0)
          .reduce((a, b) => a + b, 0),
        props.resourceScore
          .map((s) => s?.lumberCollected ?? 0)
          .reduce((a, b) => a + b, 0)
      );
    });

    const upkeepComparison = computed<string>(() => {
      return comparison(
        props.resourceScore
          .map((s) => s?.goldUpkeepLost ?? 0)
          .reduce((a, b) => a + b, 0),
        props.resourceScoreOpponent
          .map((s) => s?.goldUpkeepLost ?? 0)
          .reduce((a, b) => a + b, 0)
      );
    });

    const armyComparison = computed<string>(() => {
      return comparison(
        props.unitScoreOpponent
          .map((s) => s?.largestArmy ?? 0)
          .reduce((a, b) => a + b, 0),
        props.unitScore.map((s) => s?.largestArmy ?? 0).reduce((a, b) => a + b, 0)
      );
    });

    const unitsKilledComparison = computed<string>(() => {
      return comparison(
        props.unitScoreOpponent
          .map((s) => s?.unitsKilled ?? 0)
          .reduce((a, b) => a + b, 0),
        props.unitScore.map((s) => s?.unitsKilled ?? 0).reduce((a, b) => a + b, 0)
      );
    });

    const unitsProducedComparison = computed<string>(() => {
      return comparison(
        props.unitScoreOpponent
          .map((s) => s?.unitsProduced ?? 0)
          .reduce((a, b) => a + b, 0),
        props.unitScore.map((s) => s?.unitsProduced ?? 0).reduce((a, b) => a + b, 0)
      );
    });

    function comparison(opponent: number, me: number): string {
      const percentageDiff = Math.abs(opponent - me) / ((opponent + me) / 2);
      if (!percentageDiff || percentageDiff < 0.25) return "";
      return opponent > me ? "w3-lost" : "w3-won";
    }

    return {
      alignText,
      goldComparison,
      woodComparison,
      upkeepComparison,
      armyComparison,
      unitsKilledComparison,
      unitsProducedComparison,
      AddValuesDelimiter,
    };
  },
});
</script>
