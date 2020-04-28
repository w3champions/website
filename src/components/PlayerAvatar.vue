<template>
  <div>
    <v-row>
      <v-col cols="5" md="12">
        <v-card-text
          style="cursor: pointer"
          @click.stop="openDialog"
          class="player-avatar text-center"
          :style="{ 'background-image': 'url(' + racePicture + ')' }"
        />
      </v-col>
      <!-- <v-col cols="7" md="12">
        <div v-if="topLeague" class="player-league">
            <img class="float-left league-image" :src="'https://w3champions.com/integration/leagues/0.png'" />

            <div class="float-right">
              <div class="player-league-rank">Rank
                <div>
                  <b>{{topLeague.rank}}</b>
                </div> 
              </div>
              <div class="mt-2 player-league-points">MMR: <b>{{topLeague.mmr}}</b></div>
              <div class="player-league-points">RP: <b>{{topLeague.rankingPoints}}</b></div>
            </div>
            <div class="float-clear"></div>
          </div>
      </v-col> -->
    </v-row>

    <v-dialog v-model="dialogOpened" max-width="1400px">
      <v-card>
        <v-row
          style="padding-left: 25px; padding-right: 25px"
          v-for="race in races"
          :key="race"
          align="center"
          justify="space-between"
        >
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
      </v-card>
    </v-dialog>

    <h3>
      Homepage:
      <template>
        <v-icon
          v-if="isLoggedInPlayer"
          class="float-lg-right"
          @click="homepageEdit.opened = !homepageEdit.opened"
          >mdi-pencil</v-icon
        >
      </template>
      <v-dialog v-model="homepageEdit.opened" max-width="500px">
        <v-card>
          <v-card-text>
            <v-form v-model="homepageEdit.savable">
              <v-text-field
                counter="50"
                :rules="[rules.maxLength(50)]"
                label="Homepage"
                placeholder="Homepage"
                v-model="homepageEdit.text"
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              :disabled="!homepageEdit.savable"
              text
              color="primary"
              @click="saveHomepageInfo"
              >Save</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
    </h3>
    <div>{{ homePage ? homePage : "-" }}</div>
    <h3>
      About:
      <template>
        <v-icon
          v-if="isLoggedInPlayer"
          class="float-lg-right"
          @click="additonalInfoEdit.opened = !additonalInfoEdit.opened"
          >mdi-pencil</v-icon
        >
      </template>
      <v-dialog v-model="additonalInfoEdit.opened" max-width="500px">
        <v-card>
          <v-card-text>
            <v-form v-model="additonalInfoEdit.savable">
              <v-textarea
                counter="300"
                :rules="[rules.maxLength(300)]"
                label="Additional Info"
                placeholder="Additional Info"
                v-model="additonalInfoEdit.text"
              ></v-textarea>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              :disabled="!additonalInfoEdit.savable"
              text
              color="primary"
              @click="saveAdditionalInfo"
              >Save</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
    </h3>
    <div>
      {{ savedMessageValue ? savedMessageValue : "-" }}
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ERaceEnum, EGameMode } from "@/store/typings";
import { RaceStat, ModeStat } from "@/store/player/types";

@Component({})
export default class PlayerAvatar extends Vue {
  @Prop() isLoggedInPlayer!: boolean;
  @Prop() wins!: RaceStat[];
  @Prop() modeStats!: ModeStat[];

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

  get homePage(): string {
    return this.personalSetting.homePage;
  }

  get savedMessageValue(): string {
    return this.personalSetting.profileMessage;
  }

  get personalSetting() {
    return this.$store.direct.state.personalSettings.personalSettings;
  }

  public rules = {
    maxLength: (len: number) => (v: string) => (v || '').length < len || `Can not exceed ${len} characters`,
  };

  public homepageEdit = { opened: false, text: this.homePage, savable: true };
  public additonalInfoEdit = { opened: false, text: this.savedMessageValue, savable: true };

  async saveAdditionalInfo() {
    await this.$store.direct.dispatch.personalSettings.saveAditionalInfo(this.additonalInfoEdit.text);
    this.additonalInfoEdit.opened = false;
  }

  async saveHomepageInfo() {
    await this.$store.direct.dispatch.personalSettings.saveHomepageInfo(this.homepageEdit.text);
    this.homepageEdit.opened = false;
  }

  getCorrectClasses(race: ERaceEnum, iconId: number) {
    const classes = ["player-avatar-choosing"];
    if (this.isLoggedInPlayer && this.enabledIfEnoughWins(race, iconId))
      classes.push("pointer");

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

  get topLeague(): ModeStat | null {
    if(!this.modeStats) {
      return null;
    }

    // We should implement sorting by league here in the future when we support more modes
    const league = this.modeStats.find(x => x.mode === EGameMode.GM_1ON1) || null;
    return league;
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
  mounted() {
    this.init();
  }

  async init() {
    await this.$store.direct.dispatch.personalSettings.loadPersonalSetting();
  }
}
</script>

<style lang="scss" scoped>
.player-avatar {
  max-width: 185px;
  height: 185px;
  background-repeat: no-repeat;
  background-size: contain;
}

.player-avatar-choosing {
  padding-top: 100%;
  width: 100%;
  background-repeat: no-repeat;
  background-size: contain;
}

.player-avatar-choosing-disabled {
  opacity: 0.5;
  filter: alpha(opacity=50);
  background-color: #000;
}

.player-league {
  width: 182px;

  .league-image {
  }

  .player-league-rank {
    font-size: 20px;
  }

  .player-league-points {
    font-size: 13px;
  }
}

.float-clear {
  clear:both;
}
</style>
