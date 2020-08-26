<template>
  <div class="season-badge" :style="{ 'background-image': 'url(' + seasonBadgeBg + ')' }" />
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Season } from "@/store/ranking/types";

@Component({})
export default class SeasonBadge extends Vue {
  @Prop() season!: Season;

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
