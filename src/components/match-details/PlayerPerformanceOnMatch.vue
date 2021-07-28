<template>
  <div>
    <v-row dense :class="left ? 'justify-end' : 'justify-start'">
      <!-- <v-col :order="0" cols="1"></v-col> -->
      <v-col :order="left ? 1 : 3" class="col-md-auto">
        <v-row dense>
          <v-col :align="align">
            {{
              $t(
                "components_match-details_playerperformanceonmatch.unitskilled"
              )
            }}
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :align="align">
            {{
              $t(
                "components_match-details_playerperformanceonmatch.unitsproduced"
              )
            }}
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :align="align">
            {{
              $t("components_match-details_playerperformanceonmatch.goldmined")
            }}
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :align="align">
            {{
              $t(
                "components_match-details_playerperformanceonmatch.lumbermined"
              )
            }}
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :align="align">
            {{
              $t("components_match-details_playerperformanceonmatch.upkeeplost")
            }}
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :align="align">
            {{
              $t(
                "components_match-details_playerperformanceonmatch.largestarmy"
              )
            }}
          </v-col>
        </v-row>
      </v-col>
      <v-col :order="1" cols="1"></v-col>
      <v-col
        class="col-md-auto"
        :order="left ? 3 : 0"
        :align="left ? 'left' : 'right'"
      >
        <v-row dense>
          <v-col :class="unitsKilledComparison" :align="align">
            <number-display :object="unitScore" value="unitsKilled" />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :class="unitsProducedComparison" :align="align">
            <number-display :object="unitScore" value="unitsProduced" />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :class="goldComparison" :align="align">
            <number-display :object="resourceScoure" value="goldCollected" />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :class="woodComparison" :align="align">
            <number-display :object="resourceScoure" value="lumberCollected" />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :class="upkeepComparison" :align="align">
            <number-display :object="resourceScoure" value="goldUpkeepLost" />
          </v-col>
        </v-row>
        <v-row dense>
          <v-col :class="armyComparison" :align="align">
            <number-display :object="unitScore" value="largestArmy" :delimiter="AddValuesDelimiter.SLASH" :align="align" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ResourceScore, UnitScore } from "@/store/typings";
import NumberDisplay from "./NumberDisplay.vue";

export enum AddValuesDelimiter {
  PLUS = " + ",
  SLASH = " / "
}

@Component({components: {NumberDisplay}})
export default class PlayerPerformanceOnMatch extends Vue {
  @Prop() left!: boolean;
  @Prop() unitScore!: UnitScore[];
  @Prop() unitScoreOpponent!: UnitScore[];
  @Prop() resourceScoure!: ResourceScore[];
  @Prop() resourceScoureOpponent!: ResourceScore[];
  
  public AddValuesDelimiter = AddValuesDelimiter

  public align = this.left ? 'right':'left'

  get goldComparison() {
    return this.comparison(
      this.resourceScoureOpponent
        .map((s) => s.goldCollected)
        .reduce((a, b) => a + b, 0),
      this.resourceScoure.map((s) => s.goldCollected).reduce((a, b) => a + b, 0)
    );
  }

  get woodComparison() {
    return this.comparison(
      this.resourceScoureOpponent
        .map((s) => s.lumberCollected)
        .reduce((a, b) => a + b, 0),
      this.resourceScoure
        .map((s) => s.lumberCollected)
        .reduce((a, b) => a + b, 0)
    );
  }

  get upkeepComparison() {
    return this.comparison(
      this.resourceScoure
        .map((s) => s.goldUpkeepLost)
        .reduce((a, b) => a + b, 0),
      this.resourceScoureOpponent
        .map((s) => s.goldUpkeepLost)
        .reduce((a, b) => a + b, 0)
    );
  }

  get armyComparison() {
    return this.comparison(
      this.unitScoreOpponent
        .map((s) => s.largestArmy)
        .reduce((a, b) => a + b, 0),
      this.unitScore.map((s) => s.largestArmy).reduce((a, b) => a + b, 0)
    );
  }

  get unitsKilledComparison() {
    return this.comparison(
      this.unitScoreOpponent
        .map((s) => s.unitsKilled)
        .reduce((a, b) => a + b, 0),
      this.unitScore.map((s) => s.unitsKilled).reduce((a, b) => a + b, 0)
    );
  }

  get unitsProducedComparison() {
    return this.comparison(
      this.unitScoreOpponent
        .map((s) => s.unitsProduced)
        .reduce((a, b) => a + b, 0),
      this.unitScore.map((s) => s.unitsProduced).reduce((a, b) => a + b, 0)
    );
  }

  public comparison(opponent: number, me: number) {
    const percentageDiff = Math.abs(opponent - me) / ((opponent + me) / 2);
    if (!percentageDiff || percentageDiff < 0.25) return "";
    return opponent > me
      ? this.$t("components_match-details_playerperformanceonmatch.lost")
      : this.$t("components_match-details_playerperformanceonmatch.won");
  }
}
</script>
