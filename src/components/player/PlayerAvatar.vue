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
    <v-row>
      <v-col
        cols="2"
        v-if="userProfile.twitch != ''"
        style="padding-top: 0px; padding-left: 2px;"
      >
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn
              icon
              v-on="on"
              :href="'http://twitch.tv/' + userProfile.twitch"
              target="_blank"
            >
              <v-icon color="purple accent-4">mdi-twitch</v-icon>
            </v-btn>
          </template>
          <span>{{ userProfile.twitch }}</span>
        </v-tooltip>
      </v-col>
      <v-col
        cols="2"
        v-if="userProfile.youtube != ''"
        style="padding-top: 0px; padding-left: 2px;"
      >
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn
              icon
              v-on="on"
              :href="'http://youtube.com/user/' + userProfile.youtube"
              target="_blank"
            >
              <v-icon color="red darken-2">mdi-youtube</v-icon>
            </v-btn>
          </template>
          <span>{{ userProfile.youtube }}</span>
        </v-tooltip>
      </v-col>
      <v-col
        cols="2"
        v-if="userProfile.twitter != ''"
        style="padding-top: 0px; padding-left: 2px;"
      >
        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <v-btn
              icon
              v-on="on"
              :href="'http://twitter.com/' + userProfile.twitter"
              target="_blank"
            >
              <v-icon color="blue darken-2">mdi-twitter</v-icon>
            </v-btn>
          </template>
          <span>{{ userProfile.twitter }}</span>
        </v-tooltip>
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

    <v-row>
      <v-col>
        <h3>Homepage:</h3>
        <div v-if="homePageLinks && homePageLinks.length > 0">
          <a
            class="d-block"
            v-for="homePageLink in homePageLinks"
            rel="noopener noreferrer nofollow"
            target="_blank"
            :href="homePageLink"
            :key="homePageLink"
          >
            {{ homePage }}
          </a>
        </div>
        <div v-else>{{ homePage }}</div>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <h3>About:</h3>
        <div>{{ savedMessageValue ? savedMessageValue : "-" }}</div>
      </v-col>
    </v-row>
    <template>
      <v-row v-if="isLoggedInPlayer">
        <v-col>
          <v-dialog
            v-model="userProfile.editDialogOpened"
            persistent
            max-width="600px"
          >
            <template v-slot:activator="{ on }">
              <v-btn
                @click="userProfile.editDialogOpened = true"
                small
                class="ma-0"
                outlined
                v-on="on"
                color="primary"
              >
                <v-icon left>mdi-pencil</v-icon>
                Edit Profile
              </v-btn>
            </template>
            <v-card>
              <v-card-title>
                <span class="headline">User Profile</span>
              </v-card-title>
              <v-card-text>
                <v-container>
                  <v-row>
                    <v-text-field
                      prepend-icon="mdi-twitch"
                      color="purple accent-4"
                      dense
                      clearable
                      single-line
                      shaped
                      prefix="https://twitch.tv/"
                      hint="Enter your Twitch username!"
                      v-model="userProfile.twitch"
                    ></v-text-field>
                    <v-text-field
                      prepend-icon="mdi-youtube"
                      color="red darken-2"
                      dense
                      clearable
                      single-line
                      shaped
                      hint="Enter your YouTube username!"
                      prefix="https://www.youtube.com/user/"
                      v-model="userProfile.youtube"
                    ></v-text-field>
                    <v-text-field
                      prepend-icon="mdi-twitter"
                      color="blue darken-2"
                      dense
                      clearable
                      single-line
                      shaped
                      hint="Enter your Twitter handle!"
                      prefix="https://www.twitter.com/"
                      v-model="userProfile.twitter"
                    ></v-text-field>
                    <v-text-field
                      prepend-icon="mdi-home"
                      color="blue darken-2"
                      dense
                      :rules="[rules.maxLength(50)]"
                      single-line
                      clearable
                      v-model="userProfile.homePage"
                      shaped
                      hint="Enter a custom homepage"
                      label="Homepage"
                    ></v-text-field>
                  </v-row>
                  <v-row>
                    <v-col>
                      <v-textarea
                        outlined
                        name="input-7-1"
                        label="About"
                        clearable
                        :rules="[rules.maxLength(300)]"
                        value
                        v-model="userProfile.about"
                        hint="Write something about yourself!"
                      ></v-textarea>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  color="blue darken-1"
                  text
                  @click="userProfile.editDialogOpened = false"
                >
                  Close
                </v-btn>
                <v-btn color="blue darken-1" text @click="saveUserProfile">
                  Save
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ERaceEnum } from "@/store/typings";
import { PersonalSetting } from "../../store/personalSettings/types";

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

  get twitch(): string {
    return this.personalSetting.twitch || "";
  }

  get youtube(): string {
    return this.personalSetting.youTube || "";
  }

  get twitter(): string {
    return this.personalSetting.twitter || "";
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

  public userProfile = {
    twitch: this.twitch,
    youtube: this.youtube,
    twitter: this.twitter,
    about: this.savedMessageValue,
    homePage: this.homePage,
    editDialogOpened: false,
  };

  async saveUserProfile() {
    let personalSetting = this.personalSetting;
    personalSetting.profileMessage = this.userProfile.about;
    personalSetting.homePage = this.userProfile.homePage;
    personalSetting.twitch = this.userProfile.twitch;
    personalSetting.youTube = this.userProfile.youtube;
    personalSetting.twitter = this.userProfile.twitter;

    await this.$store.direct.dispatch.personalSettings.saveUserProfile(
      personalSetting
    );
    this.userProfile.editDialogOpened = false;
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

    this.userProfile = {
      twitch: this.twitch,
      homePage: this.homePage,
      about: this.savedMessageValue,
      youtube: this.youtube,
      twitter: this.twitter,
      editDialogOpened: false,
    };
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
