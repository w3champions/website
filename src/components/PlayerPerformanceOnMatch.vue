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
        cols="2"
        :align="left ? 'left' : 'right'"
      >
        {{ unitScore.unitsKilled }}
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
        cols="2"
        :align="left ? 'left' : 'right'"
      >
        {{ unitScore.unitsProduced }}
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
        cols="2"
        :align="left ? 'left' : 'right'"
      >
        {{ resourceScoure.goldCollected }}
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
        cols="2"
        :align="left ? 'left' : 'right'"
      >
        {{ resourceScoure.lumberCollected }}
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
        cols="2"
        :align="left ? 'left' : 'right'"
      >
        {{ resourceScoure.goldUpkeepLost }}
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
        cols="2"
        :align="left ? 'left' : 'right'"
      >
        {{ unitScore.largestArmy }}
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

  @Prop() unitScore!: UnitScore;
  @Prop() unitScoreOpponent!: UnitScore;
  @Prop() resourceScoure!: ResourceScore;
  @Prop() resourceScoureOpponent!: ResourceScore;

  get goldComparison() {
    return this.comparison(
      this.resourceScoureOpponent.goldCollected,
      this.resourceScoure.goldCollected
    );
  }

  get woodComparison() {
    return this.comparison(
      this.resourceScoureOpponent.lumberCollected,
      this.resourceScoure.lumberCollected
    );
  }

  get upkeepComparison() {
    return this.comparison(
      this.resourceScoure.goldUpkeepLost,
      this.resourceScoureOpponent.goldUpkeepLost
    );
  }

  get armyComparison() {
    return this.comparison(
      this.unitScoreOpponent.largestArmy,
      this.unitScore.largestArmy
    );
  }

  get unitsKilledComparison() {
    return this.comparison(
      this.unitScoreOpponent.unitsKilled,
      this.unitScore.unitsKilled
    );
  }

  get unitsProducedComparison() {
    return this.comparison(
      this.unitScoreOpponent.unitsProduced,
      this.unitScore.unitsProduced
    );
  }

  public comparison(opponent: number, me: number) {
    const percentageDiff = Math.abs(opponent - me) / ((opponent + me) / 2);
    if (!percentageDiff || percentageDiff < 0.25) return "";
    return opponent > me ? "lost" : "won";
  }
}
</script>
