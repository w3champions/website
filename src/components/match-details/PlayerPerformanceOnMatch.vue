<template>
  <div>
    <v-row dense :class="left ? 'justify-end' : 'justify-start'">
      <v-col :order="left ? 1 : 3" class="col-md-auto">
        <v-row dense>
          <v-col :align="alignText">{{ $t("components_match-details_playerperformanceonmatch.unitskilled") }}</v-col>
        </v-row>
        <v-row dense>
          <v-col :align="alignText">{{ $t("components_match-details_playerperformanceonmatch.unitsproduced") }}</v-col>
        </v-row>
        <v-row dense>
          <v-col :align="alignText">{{ $t("components_match-details_playerperformanceonmatch.goldmined") }}</v-col>
        </v-row>
        <v-row dense>
          <v-col :align="alignText">{{ $t("components_match-details_playerperformanceonmatch.lumbermined") }}</v-col>
        </v-row>
        <v-row dense>
          <v-col :align="alignText">{{ $t("components_match-details_playerperformanceonmatch.upkeeplost") }}</v-col>
        </v-row>
        <v-row dense>
          <v-col :align="alignText">{{ $t("components_match-details_playerperformanceonmatch.largestarmy") }}</v-col>
        </v-row>
      </v-col>
      <v-col :order="1" cols="1"></v-col>
      <v-col
        class="col-md-auto"
        :order="left ? 3 : 0"
        :align="left ? 'left' : 'right'"
      >
        <v-row dense>
          <v-col :class="unitsKilledComparison" :align="alignText">
            <number-display :object="unitScore" value="unitsKilled" />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :class="unitsProducedComparison" :align="alignText">
            <number-display :object="unitScore" value="unitsProduced" />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :class="goldComparison" :align="alignText">
            <number-display :object="resourceScore" value="goldCollected" />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :class="woodComparison" :align="alignText">
            <number-display :object="resourceScore" value="lumberCollected" />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :class="upkeepComparison" :align="alignText">
            <number-display :object="resourceScore" value="goldUpkeepLost" />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :class="armyComparison" :align="alignText">
            <number-display
              :object="unitScore"
              value="largestArmy"
              :delimiter="AddValuesDelimiter.SLASH"
              :align="alignText"
            />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, ref } from "vue";
import { ResourceScore, UnitScore } from "@/store/types";
import NumberDisplay from "./NumberDisplay.vue";
import { TranslateResult } from "vue-i18n";
import { i18n } from "@/main";

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
      required: true,
    },
    resourceScore: {
      type: Array<ResourceScore>,
      required: true,
    },
    unitScoreOpponent: {
      type: Array<UnitScore>,
      required: true,
    },
    resourceScoreOpponent: {
      type: Array<ResourceScore>,
      required: true,
    },
    left: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const alignText = ref<string>(props.left ? "right" : "left");

    const goldComparison: ComputedRef<TranslateResult> = computed((): TranslateResult => {
      return comparison(
        props.resourceScoreOpponent
          .map((s) => s.goldCollected)
          .reduce((a, b) => a + b, 0),
        props.resourceScore.map((s) => s.goldCollected).reduce((a, b) => a + b, 0)
      );
    });

    const woodComparison: ComputedRef<TranslateResult> = computed((): TranslateResult => {
      return comparison(
        props.resourceScoreOpponent
          .map((s) => s.lumberCollected)
          .reduce((a, b) => a + b, 0),
        props.resourceScore
          .map((s) => s.lumberCollected)
          .reduce((a, b) => a + b, 0)
      );
    });

    const upkeepComparison: ComputedRef<TranslateResult> = computed((): TranslateResult => {
      return comparison(
        props.resourceScore
          .map((s) => s.goldUpkeepLost)
          .reduce((a, b) => a + b, 0),
        props.resourceScoreOpponent
          .map((s) => s.goldUpkeepLost)
          .reduce((a, b) => a + b, 0)
      );
    });

    const armyComparison: ComputedRef<TranslateResult> = computed((): TranslateResult => {
      return comparison(
        props.unitScoreOpponent
          .map((s) => s.largestArmy)
          .reduce((a, b) => a + b, 0),
        props.unitScore.map((s) => s.largestArmy).reduce((a, b) => a + b, 0)
      );
    });

    const unitsKilledComparison: ComputedRef<TranslateResult> = computed((): TranslateResult => {
      return comparison(
        props.unitScoreOpponent
          .map((s) => s.unitsKilled)
          .reduce((a, b) => a + b, 0),
        props.unitScore.map((s) => s.unitsKilled).reduce((a, b) => a + b, 0)
      );
    });

    const unitsProducedComparison: ComputedRef<TranslateResult> = computed((): TranslateResult => {
      return comparison(
        props.unitScoreOpponent
          .map((s) => s.unitsProduced)
          .reduce((a, b) => a + b, 0),
        props.unitScore.map((s) => s.unitsProduced).reduce((a, b) => a + b, 0)
      );
    });

    function comparison(opponent: number, me: number): TranslateResult {
      const percentageDiff = Math.abs(opponent - me) / ((opponent + me) / 2);
      if (!percentageDiff || percentageDiff < 0.25) return "";
      return opponent > me
        ? i18n.t("components_match-details_playerperformanceonmatch.lost")
        : i18n.t("components_match-details_playerperformanceonmatch.won");
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
