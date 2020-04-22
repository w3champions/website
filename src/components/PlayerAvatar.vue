<template>
  <img :src="raceIcon" :alt="race" />
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ERaceEnum } from "@/store/typings";

@Component({})
export default class PlayerAvatar extends Vue {
  @Prop() race!: ERaceEnum;
  @Prop() wins!: number;

  get raceIcon() {
    const images = require.context('../assets/raceAvatars/', false, /\.png$/);
    return images('./' + ERaceEnum[this.race] + "_" + this.parseWins(this.wins) + ".png")
  }

  private parseWins(wins: number) {
    if (wins > 1000) return 6;
    if (wins > 500) return 5;
    if (wins > 200) return 4;
    if (wins > 75) return 3;
    if (wins > 20) return 2;
    if (wins > 5) return 1;

    return 0;
  }
}
</script>

<style lang="scss" scoped>
.player-avatar {
  width: 90px;
  height: 90px;
  background-position: center;
  background-size: cover;
}
</style>
