<template>
  <img :src="leagueIcon()" class="league-icon" :alt="league" />
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class LeagueIcon extends Vue {
  @Prop() league!: number;

  leagueIcon() {
    const images = require.context('../../assets/leagueIcons/', false, /\.png$/);
    return images('./' + this.league + ".png")
  }
}
</script>

<style lang="scss" scoped>
.league-icon {
  width: 24px;
  margin-right: 10px;
  vertical-align: middle;
};

</style>
