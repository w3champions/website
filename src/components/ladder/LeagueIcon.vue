<template>
  <img :src="leagueIcon()" class="league-icon" />
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class LeagueIcon extends Vue {
  @Prop() league!: number;

  leagueIcon() {
    if (this.league != undefined) {
      return `/assets/leagueIcons/${this.league}.png`;
    }

    return "";
  }
}
</script>

<style lang="scss" scoped>
.league-icon {
  width: 24px;
  margin-right: 10px;
  vertical-align: middle;
}
</style>
