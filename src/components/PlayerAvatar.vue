<template>
  <div>
    <v-card-text
      style="cursor: pointer"
      @click.stop="openDialog"
      class="player-avatar text-center"
      :style="{ 'background-image': 'url(' + racePicture + ')' }"
    />

    <v-dialog max-width="1400px" v-model="dialogOpened">
      <v-card>
        <v-card-text style="padding-bottom: 0 !important;">
          <v-row v-for="race in races" :key="race">
            <v-col cols="1" v-for="number in PicNumbers" :key="number">
              <v-tooltip top>
                <template v-slot:activator="{ on }">
                  <v-card-text
                    v-on="on"
                    :class="getCorrectClasses(race, number)"
                    @click="isLoggedInPlayer ? savePicture(race, number) : null"
                    :style="{
                      'background-image': 'url(' + picture(race, number) + ')'
                    }"
                  />
                </template>
                <span>{{ winsOf(winsOfRace(race), number) }}</span>
              </v-tooltip>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ERaceEnum } from "@/store/typings";
import { RaceStat } from "@/store/player/types";

@Component({})
export default class PlayerAvatar extends Vue {
  @Prop() race!: ERaceEnum;
  @Prop() icon!: number;
  @Prop() btag!: string;
  @Prop() isLoggedInPlayer!: boolean;
  @Prop() wins!: RaceStat[];

  public dialogOpened = false;
  public races = [
    ERaceEnum.HUMAN,
    ERaceEnum.ORC,
    ERaceEnum.NIGHT_ELF,
    ERaceEnum.UNDEAD,
    ERaceEnum.RANDOM
  ];
  public PicNumbers = Array.from(Array(11).keys());

  get racePicture() {
    return require("../assets/raceAvatars/" +
      ERaceEnum[this.race] +
      "_" +
      this.icon +
      ".png");
  }

  getCorrectClasses(race: ERaceEnum, iconId: number) {
    const classes = ["player-avatar-choosing"];
    if (this.isLoggedInPlayer && this.enabledIfEnoughWins(race, iconId))
      classes.push("player-avatar-choosing-clickable");

    if (!this.enabledIfEnoughWins(race, iconId))
      classes.push("player-avatar-choosing-disabled");

    return classes;
  }

  enabledIfEnoughWins(race: ERaceEnum, iconId: number) {
    const wins = this.winsOfRace(race);
    const neededWins = this.winsTransformed(iconId);
    return wins >= neededWins;
  }

  winsOfRace(race: ERaceEnum) {
    return this.wins.filter(w => w.race == race)[0].wins;
  }

  winsOf(wins: number, iconId: number) {
    return `${wins}/${this.winsTransformed(iconId)}`;
  }

  private winsTransformed(iconId: number) {
    if (iconId == 0) return 0;
    if (iconId == 1) return 5;
    if (iconId == 2) return 20;
    if (iconId == 3) return 50;
    if (iconId == 4) return 120;
    if (iconId == 5) return 200;
    if (iconId == 6) return 300;
    if (iconId == 7) return 450;
    if (iconId == 8) return 600;
    if (iconId == 9) return 900;
    if (iconId == 10) return 1200;
    return 0;
  }

  picture(race: ERaceEnum, nePic: number) {
    return require("../assets/raceAvatars/" +
      ERaceEnum[race] +
      "_" +
      nePic +
      ".png");
  }

  openDialog() {
    this.dialogOpened = true;
  }

  async savePicture(race: ERaceEnum, picture: number) {
    if (!this.enabledIfEnoughWins(race, picture)) return;
    await this.$store.direct.dispatch.personalSettings.saveAvatar({
      race: race,
      pictureId: picture
    });

    await this.$store.direct.dispatch.personalSettings.loadPersonalSetting(
      this.btag
    );
    this.dialogOpened = false;
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

.player-avatar-choosing {
  width: 100px;
  height: 100px;
  background-repeat: no-repeat;
  background-size: contain;
}

.player-avatar-choosing-clickable {
  cursor: pointer;
}

.player-avatar-choosing-disabled {
  opacity: 0.6;
  filter: alpha(opacity=40);
  background-color: #000;
}
</style>
