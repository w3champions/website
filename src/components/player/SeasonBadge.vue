<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <div
        v-on="on"
        class="season-badge"
        :style="{ 'background-image': 'url(' + seasonBadgeBg + ')' }"
      />
    </template>
    <span>Season: {{ seasonId }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Season } from "@/store/ranking/types";

@Component({})
export default class SeasonBadge extends Vue {
  @Prop() season!: Season;

  get seasonId() {
    return this.season.id === 0 ? "β" : this.season.id
  }

  get seasonBadgeBg() {
    return require("../../assets/seasonBadges/" + this.season.id + ".png");
  }
}
</script>

<style lang="scss" scoped>
.season-badge {
  margin-right: 10px;
  width: 24px;
  height: 24px;
  background-size: cover;
}
</style>
