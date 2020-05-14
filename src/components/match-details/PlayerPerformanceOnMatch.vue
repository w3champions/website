<template>
  <div>
    <v-row dense>
      <v-col :order="left ? 0 : 2" :align="left ? 'right' : 'left'">
        Units killed
      </v-col>
      <v-col :order="1" cols="1"></v-col>
      <v-col
        :class="unitsKilledComparison"
        :order="left ? 2 : 0"
        :cols="is2v2 ? 3 : 2"
        :align="left ? 'left' : 'right'"
      >
        {{ unitScore.map(r => r.unitsKilled).join(" + ") }}
      </v-col>
    </v-row>
    <v-row dense>
      <v-col :order="left ? 0 : 2" :align="left ? 'right' : 'left'">
        Units produced
      </v-col>
      <v-col :order="1" cols="1"></v-col>
      <v-col
        :class="unitsProducedComparison"
        :order="left ? 2 : 0"
        :cols="is2v2 ? 3 : 2"
        :align="left ? 'left' : 'right'"
      >
        {{ unitScore.map(r => r.unitsProduced).join(" + ") }}
      </v-col>
    </v-row>
    <v-row dense>
      <v-col :order="left ? 0 : 2" :align="left ? 'right' : 'left'">
        Gold mined
      </v-col>
      <v-col :order="1" cols="1"></v-col>
      <v-col
        :class="goldComparison"
        :order="left ? 2 : 0"
        :cols="is2v2 ? 3 : 2"
        :align="left ? 'left' : 'right'"
      >
        {{ resourceScoure.map(r => r.goldCollected).join(" + ")  }}
      </v-col>
    </v-row>
    <v-row dense>
      <v-col :order="left ? 0 : 2" :align="left ? 'right' : 'left'">
        Lumber harversted
      </v-col>
      <v-col :order="1" cols="1"></v-col>
      <v-col
        :class="woodComparison"
        :order="left ? 2 : 0"
        :cols="is2v2 ? 3 : 2"
        :align="left ? 'left' : 'right'"
      >
        {{ resourceScoure.map(r => r.lumberCollected).join(" + ") }}
      </v-col>
    </v-row>
    <v-row dense>
      <v-col :order="left ? 0 : 2" :align="left ? 'right' : 'left'">
        Upkeep lost
      </v-col>
      <v-col :order="1" cols="1"></v-col>
      <v-col
        :class="upkeepComparison"
        :order="left ? 2 : 0"
        :cols="is2v2 ? 3 : 2"
        :align="left ? 'left' : 'right'"
      >
        {{ resourceScoure.map(r => r.goldUpkeepLost).join(" + ") }}
      </v-col>
    </v-row>
    <v-row dense>
      <v-col :order="left ? 0 : 2" :align="left ? 'right' : 'left'">
        Largest army
      </v-col>
      <v-col :order="1" cols="1"></v-col>
      <v-col
        :class="armyComparison"
        :order="left ? 2 : 0"
        :cols="is2v2 ? 3 : 2"
        :align="left ? 'left' : 'right'"
      >
        {{ unitScore.map(r => r.largestArmy).join(" / ") }}
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ResourceScore, UnitScore } from "@/store/typings";

@Component({})
export default class PlayerPerformanceOnMatch extends Vue {
  @Prop() left!: boolean;

  @Prop() unitScore!: UnitScore[];
  @Prop() unitScoreOpponent!: UnitScore[];
  @Prop() resourceScoure!: ResourceScore[];
  @Prop() resourceScoureOpponent!: ResourceScore[];

  get is2v2() {
    return this.unitScore.length > 1;
  }

  get goldComparison() {
    return this.comparison(
      this.resourceScoureOpponent.map(s => s.goldCollected).reduce((a, b) => a + b, 0),
      this.resourceScoure.map(s => s.goldCollected).reduce((a, b) => a + b, 0)
    );
  }

  get woodComparison() {
    return this.comparison(
      this.resourceScoureOpponent.map(s => s.lumberCollected).reduce((a, b) => a + b, 0),
      this.resourceScoure.map(s => s.lumberCollected).reduce((a, b) => a + b, 0)
    );
  }

  get upkeepComparison() {
    return this.comparison(
      this.resourceScoure.map(s => s.goldUpkeepLost).reduce((a, b) => a + b, 0),
      this.resourceScoureOpponent.map(s => s.goldUpkeepLost).reduce((a, b) => a + b, 0)
    );
  }

  get armyComparison() {
    return this.comparison(
      this.unitScoreOpponent.map(s => s.largestArmy).reduce((a, b) => a + b, 0),
      this.unitScore.map(s => s.largestArmy).reduce((a, b) => a + b, 0)
    );
  }

  get unitsKilledComparison() {
    return this.comparison(
      this.unitScoreOpponent.map(s => s.unitsKilled).reduce((a, b) => a + b, 0),
      this.unitScore.map(s => s.unitsKilled).reduce((a, b) => a + b, 0)
    );
  }

  get unitsProducedComparison() {
    return this.comparison(
      this.unitScoreOpponent.map(s => s.unitsProduced).reduce((a, b) => a + b, 0),
      this.unitScore.map(s => s.unitsProduced).reduce((a, b) => a + b, 0)
    );
  }

  public comparison(opponent: number, me: number) {
    const percentageDiff = Math.abs(opponent - me) / ((opponent + me) / 2);
    if (!percentageDiff || percentageDiff < 0.25) return "";
    return opponent > me ? "lost" : "won";
  }
}
</script>
