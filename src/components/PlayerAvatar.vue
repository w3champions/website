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
        <v-card-title class="headline">Choose a picture</v-card-title>
        <v-card-text>
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
import { PersonalSetting } from "@/store/personalSettings/types";

@Component({})
export default class PlayerAvatar extends Vue {
  @Prop() personalSetting!: PersonalSetting;
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
      ERaceEnum[this.personalRace] +
      "_" +
      this.personalRaceIcon +
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

  get personalRaceIcon(): number {
    return this.personalSetting?.profilePicture?.pictureId ?? 0;
  }

  get personalRace(): ERaceEnum {
    return this.personalSetting?.profilePicture?.race ?? ERaceEnum.TOTAL;
  }

  enabledIfEnoughWins(race: ERaceEnum, iconId: number) {
    return (
      this.personalSetting.pickablePictures?.filter(r => r.race == race)[0]
        .max >= iconId
    );
  }

  winsOfRace(race: ERaceEnum) {
    return this.wins.filter(w => w.race == race)[0].wins;
  }

  winsOf(wins: number, iconId: number) {
    return `${wins}/${this.winsTransformed(iconId)}`;
  }

  winsTransformed(iconId: number) {
    return this.personalSetting.pictureRange?.filter(
      p => p.pictureId == iconId
    )[0]?.neededWins;
  }

  picture(race: ERaceEnum, picId: number) {
    return require("../assets/raceAvatars/" +
      ERaceEnum[race] +
      "_" +
      picId +
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
