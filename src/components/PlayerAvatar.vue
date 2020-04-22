<template>
  <div>
    <v-card-text
      @click.stop="openDialog"
      class="player-avatar text-center"
      :style="{ 'background-image': 'url(' + racePicture + ')' }"
    />

    <v-dialog max-width="1400px" v-model="dialogOpened">
      <v-card>
        <v-card-title class="headline">Choose a picture</v-card-title>
        <v-card-text>
          <v-row v-for="race in races" :key="race">
            <v-col cols="1" v-for="nePic in PicNumbers" :key="nePic">
              <v-card-text
                class="player-avatar-choosing"
                :style="{
                  'background-image': 'url(' + picture(race, nePic) + ')'
                }"
              />
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

@Component({})
export default class PlayerAvatar extends Vue {
  @Prop() race!: ERaceEnum;
  @Prop() icon!: number;
  @Prop() btag!: string;

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

  async savePicture() {
    await this.$store.direct.dispatch.personalSettings.saveAvatar({
      race: ERaceEnum.NIGHT_ELF,
      pictureId: 3
    });

    await this.$store.direct.dispatch.personalSettings.loadPersonalSetting(
      this.btag
    );
    this.dialogOpened = false;
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

.player-avatar-choosing {
  width: 100px;
  height: 100px;
  background-repeat: no-repeat;
  background-size: contain;
}
</style>
