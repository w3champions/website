<template>
  <div>
    <v-row>
      <v-col :order="left ? 0 : 1" :align="left ? 'right' : 'left'">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-icon class="mr-4 ml-4" v-on="on">mdi-skull</v-icon>
          </template>
          <div>
            Heroes killed
          </div>
        </v-tooltip>
      </v-col>
      <v-col :class="heroKillsComparison" :align="left ? 'left' : 'right'">
        {{ heroKills }}
      </v-col>
    </v-row>
    <v-row>
      <v-col :order="left ? 0 : 1" :align="left ? 'right' : 'left'">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-icon class="mr-4 ml-4" v-on="on">mdi-chevron-triple-up</v-icon>
          </template>
          <div>
            Experience gained
          </div>
        </v-tooltip>
      </v-col>
      <v-col :class="experienceComparison" :align="left ? 'left' : 'right'">
        {{ experience }}
      </v-col>
    </v-row>
    <v-row>
      <v-col :order="left ? 0 : 1" :align="left ? 'right' : 'left'">
        <v-tooltip top>
          <template v-slot:activator="{ on }">
            <v-icon class="mr-4 ml-4" v-on="on">mdi-treasure-chest</v-icon>
          </template>
          <div>
            Items collected
          </div>
        </v-tooltip>
      </v-col>
      <v-col :class="itemsCollectedComparison" :align="left ? 'left' : 'right'">
        {{ itemsCollected }}
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class MatchHiglight extends Vue {
  @Prop() experience!: number;
  @Prop() experienceOpponent!: number;
  @Prop() left!: boolean;
  @Prop() heroKills!: number;
  @Prop() heroKillsOpponent!: number;
  @Prop() itemsCollected!: number;
  @Prop() itemsCollectedOpponent!: number;

  get heroKillsComparison() {
    return this.comparison(this.heroKillsOpponent, this.heroKills);
  }

  get itemsCollectedComparison() {
    return this.comparison(this.itemsCollectedOpponent, this.itemsCollected);
  }

  get experienceComparison() {
    return this.comparison(this.experienceOpponent, this.experience);
  }

  public comparison(opponent: number, me: number) {
    const percentageDiff = Math.abs(opponent - me) / ((opponent + me) / 2);
    if (!percentageDiff || percentageDiff < 0.25) return "";
    return opponent > me ? "lost" : "won";
  }
}
</script>
