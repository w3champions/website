<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <div
        @click="() => onClick(season)"
        v-on="on"
        class="season-badge pointer"
        :style="{ 'background-image': 'url(' + seasonBadgeBg + ')' }"
      />
    </template>
    <span>participated in season {{ seasonId }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Season } from "@/store/ranking/types";

@Component({})
export default class SeasonBadge extends Vue {
  @Prop() season!: Season;
  @Prop() onClick!: (season: Season) => void;

  get seasonId() {
    if (!this.season) return "";
    return this.season.id === 0 ? "β" : this.season.id;
  }

  get seasonBadgeBg() {
    return require("../../assets/seasonBadges/" + this.season.id + ".png");
  }
}
</script>

<style lang="scss" scoped>
.season-badge {
  margin-right: 14px;
  width: 20px;
  height: 24px;
  background-size: cover;
}
</style>
