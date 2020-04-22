<template>
  <div
    @click="savePicture"
    class="player-avatar text-center"
    :style="{'background-image': 'url(' + racePicture + ')'}"
  />
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ERaceEnum } from "@/store/typings";

@Component({})
export default class PlayerAvatar extends Vue {
  @Prop() race!: ERaceEnum;
  @Prop() icon!: number;

  get racePicture() {
    return require('../assets/raceAvatars/' + ERaceEnum[this.race] + '_' + this.icon + '.png');
  }

  savePicture() {
    this.$store.direct.dispatch.personalSettings.saveAvatar({ race: ERaceEnum.NIGHT_ELF, pictureId: 3 });
  }

  private parseWins(wins: number) {
    if (wins >= 1200) return 10;
    if (wins >= 900) return 9;
    if (wins >= 600) return 8;
    if (wins >= 450) return 7;
    if (wins >= 300) return 6;
    if (wins >= 200) return 5;
    if (wins >= 120) return 4;
    if (wins >= 50) return 3;
    if (wins >= 20) return 2;
    if (wins >= 5) return 1;

    return 0;
  }
}
</script>

<style lang="scss" scoped>
.player-avatar {
  padding-top: 100%;
  padding-bottom: 20px;
  width: 100%;
  background-repeat: no-repeat;
  background-size: contain;
}
</style>
