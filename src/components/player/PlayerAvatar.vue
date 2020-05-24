<template>
  <div>
    <v-row>
      <v-col cols="5" md="12">
        <v-card-text
          style="cursor: pointer;"
          @click.stop="openDialog"
          class="player-avatar text-center"
          :style="{
            'background-image':
              'url(' + picture(personalRace, personalRaceIcon) + ')',
          }"
        />
      </v-col>
    </v-row>

    <v-dialog v-model="dialogOpened" max-width="1400px">
      <v-card>
        <v-row
          style="padding-left: 25px; padding-right: 25px;"
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
                    'background-image': 'url(' + picture(race, number) + ')',
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
        >
          mdi-pencil
        </v-icon>
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
            >
              Save
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </h3>
    <div v-if="homePageLinks && homePageLinks.length > 0">
      <a
        class="d-block"
        v-for="homePageLink in homePageLinks"
        rel="noopener noreferrer nofollow"
        target="_blank"
        :href="homePageLink"
        :key="homePageLink"
      >
        {{ homePageLink }}
      </a>
    </div>
    <div v-else>{{ homePage }}</div>
    <h3>
      About:
      <template>
        <v-icon
          v-if="isLoggedInPlayer"
          class="float-lg-right"
          @click="additonalInfoEdit.opened = !additonalInfoEdit.opened"
        >
          mdi-pencil
        </v-icon>
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
            >
              Save
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </h3>
    <div>{{ savedMessageValue ? savedMessageValue : "-" }}</div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ERaceEnum } from "@/store/typings";

@Component({})
export default class PlayerAvatar extends Vue {
  @Prop() isLoggedInPlayer!: boolean;

  public dialogOpened = false;
  public races = [
    ERaceEnum.HUMAN,
    ERaceEnum.ORC,
    ERaceEnum.NIGHT_ELF,
    ERaceEnum.UNDEAD,
    ERaceEnum.RANDOM,
  ];
  public PicNumbers = Array.from(Array(11).keys());

  get homePage(): string {
    return this.personalSetting.homePage || "-";
  }

  get homePageLinks(): Array<string> {
    if (!this.homePage || !this.homePage.includes("http")) {
      return [];
    }

    return this.homePage
      .split(" ")
      .filter((url) => !!url)
      .map((url) => url.trim());
  }

  get savedMessageValue(): string {
    return this.personalSetting.profileMessage;
  }

  get personalSetting() {
    return this.$store.direct.state.personalSettings.personalSettings;
  }

  public rules = {
    maxLength: (len: number) => (v: string) =>
      (v || "").length < len || `Can not exceed ${len} characters`,
  };

  public homepageEdit = { opened: false, text: this.homePage, savable: true };
  public additonalInfoEdit = {
    opened: false,
    text: this.savedMessageValue,
    savable: true,
  };

  async saveAdditionalInfo() {
    await this.$store.direct.dispatch.personalSettings.saveAditionalInfo(
      this.additonalInfoEdit.text
    );
    this.additonalInfoEdit.opened = false;
  }

  async saveHomepageInfo() {
    await this.$store.direct.dispatch.personalSettings.saveHomepageInfo(
      this.homepageEdit.text
    );
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

  enabledIfEnoughWins(race: ERaceEnum, iconId: number) {
    return (
      this.personalSetting.pickablePictures?.filter((r) => r.race == race)[0]
        .max >= iconId
    );
  }

  winsOfRace(race: ERaceEnum) {
    return (
      this.personalSetting.winLosses?.filter((w) => w.race == race)[0]?.wins ??
      0
    );
  }

  winsOf(wins: number, iconId: number) {
    return `${wins}/${this.winsTransformed(iconId)}`;
  }

  winsTransformed(iconId: number) {
    return this.personalSetting.pictureRange?.filter(
      (p) => p.pictureId == iconId
    )[0]?.neededWins;
  }

  picture(race: ERaceEnum, picId: number) {
    return require("../../assets/raceAvatars/" +
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
      pictureId: picture,
    });

    this.dialogOpened = false;
  }
  mounted() {
    this.init();
  }

  async init() {
    await this.$store.direct.dispatch.personalSettings.loadPersonalSetting();
    this.homepageEdit.text = this.homePage;
    this.additonalInfoEdit.text = this.savedMessageValue;
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
}

.player-league {
  width: 182px;

  .player-league-rank {
    font-size: 20px;
  }

  .player-league-points {
    font-size: 13px;
  }
}
</style>
