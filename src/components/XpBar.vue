<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <v-progress-linear
        v-on="on"
        :value="(ranking.level - Math.floor(ranking.level)) * 100"
        height="15"
        :color="color"
      ></v-progress-linear>
    </template>
    <div>
      <span class="level">XP: {{ ranking.xp }}</span>
    </div>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Ranking } from "../store/ranking/types";

@Component({})
export default class XpBar extends Vue {
  @Prop() public ranking!: Ranking;

  get color() {
    return this.$store.direct.state.darkMode ? "grey" : "black";
  }
}
</script>
