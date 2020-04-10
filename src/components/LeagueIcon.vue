<template>
  <span >
    <span class="league-icon" :class="[leagueIcon()]"/>
    {{ leagueName }}
  </span>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class LeagueIcon extends Vue {
  @Prop() league!: number;
  @Prop() leagueName!: string;

  leagueIcon() {
    return "league-icon-" + this.league;
  }
}
</script>

<style lang="scss" scoped>
.league-icon {
  width: 24px;
  height: 24px;
  margin-right: 24px;
  float: left;
  background-position: center;
  background-size: cover;
}

.league-icon-container {
  vertical-align: middle;
}

.league-icon-0 {
  background-image: url("../assets/leagueIcons/0.png");
}

.league-icon-1 {
  background-image: url("../assets/leagueIcons/1.png");
}

.league-icon-2 {
  background-image: url("../assets/leagueIcons/2.png");
}

.league-icon-3 {
  background-image: url("../assets/leagueIcons/3.png");
}

.league-icon-4 {
  background-image: url("../assets/leagueIcons/4.png");
}

</style>
