<template>
  <div>
    <v-row>
      <v-col cols="5" md="12">
        <v-tooltip top v-bind:disabled="!avatarDescription">
          <template v-slot:activator="{ on }">
            <v-card-text
              v-on="on"
              style="cursor: pointer"
              @click.stop="openDialog"
              class="player-avatar text-center"
              :style="{
                'background-image':
                  'url(' + picture(avatarCategory, avatarIcon) + ')',
              }"
            />
          </template>
          <span>{{ avatarDescription }}</span>
        </v-tooltip>

        <v-tooltip bottom>
          <template v-slot:activator="{ on }">
            <div
              v-on="on"
              class="country__container clickable"
              @click="goToCountryRankings()"
            >
              <country-flag
                v-if="selectedCountryCode != ''"
                class="player-country"
                :country="selectedCountryCode"
                size="normal"
              />
            </div>
          </template>
          <span>{{ selectedCountry }}</span>
        </v-tooltip>
      </v-col>
    </v-row>
    <player-socials :userProfile="userProfile" />

    <v-dialog v-model="dialogOpened" max-width="1400px" class="scroll-v-dialog">
      <v-card>
        <v-checkbox
          style="margin-left: 25px"
          v-model="useClassicIcons"
          :label="$t('components_player_playeravatar.useClassicIcons')"
        ></v-checkbox>
        <v-row
          style="padding-left: 25px; padding-right: 25px"
          v-for="race in races"
          :key="race"
          align="center"
          justify="space-between"
        >
          <v-col cols="1" v-for="number in picNumbers" :key="number">
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
        <v-row
          class="special-icons"
          style="padding-left: 25px; padding-right: 25px"
          align="center"
        >
          <v-col
            cols="1"
            v-for="specialPicture in specialPictures"
            :key="specialPicture.pictureId"
          >
            <v-tooltip top>
              <template v-slot:activator="{ on }">
                <v-card-text
                  v-on="on"
                  class="player-avatar-choosing"
                  v-bind:class="{ pointer: isLoggedInPlayer }"
                  @click="
                    isLoggedInPlayer
                      ? savePicture(
                          specialAvatarCategory,
                          specialPicture.pictureId,
                          specialPicture.description
                        )
                      : null
                  "
                  :style="{
                    'background-image':
                      'url(' +
                      picture(specialAvatarCategory, specialPicture.pictureId) +
                      ')',
                  }"
                />
              </template>
              <span>{{ specialPicture.description }}</span>
            </v-tooltip>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>

    <v-row>
      <v-col style="margin-top: -15px">
        <h3>
          {{ $t("components_player_playeravatar.games") }}
          {{ playerGames }}
        </h3>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <h3>{{ $t("components_player_playeravatar.homepage") }}</h3>
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
        <h3>{{ $t("components_player_playeravatar.about") }}</h3>
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
                {{ $t("components_player_playeravatar.edit") }}
              </v-btn>
            </template>
            <v-card>
              <v-card-title>
                <span class="headline">
                  {{ $t("components_player_playeravatar.userprofile") }}
                </span>
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
                      :hint="
                        $t('components_player_playeravatar.entertwitchname')
                      "
                      v-model="userProfile.twitch"
                    ></v-text-field>
                    <v-text-field
                      prepend-icon="mdi-youtube"
                      color="red darken-2"
                      dense
                      clearable
                      single-line
                      shaped
                      :hint="$t('components_player_playeravatar.enterytname')"
                      prefix="https://www.youtube.com/"
                      v-model="userProfile.youtube"
                    ></v-text-field>
                    <v-text-field
                      prepend-icon="mdi-twitter"
                      color="blue darken-2"
                      dense
                      clearable
                      single-line
                      shaped
                      :hint="
                        $t('components_player_playeravatar.entertwittername')
                      "
                      prefix="https://www.twitter.com/"
                      v-model="userProfile.twitter"
                    ></v-text-field>
                    <v-text-field
                      prepend-icon="$trovo"
                      color="green darken-3"
                      dense
                      clearable
                      single-line
                      shaped
                      :hint="
                        $t('components_player_playeravatar.entertrovoname')
                      "
                      prefix="https://trovo.live/"
                      v-model="userProfile.trovo"
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
                      :hint="$t('components_player_playeravatar.entercustomhp')"
                      label="Homepage"
                    ></v-text-field>
                    <v-container>
                      <v-checkbox
                        dense
                        class="alias-checkbox"
                        prepend-icon="mdi-account-check"
                        v-model="userProfile.aliasSettings.showAka"
                        :label="$t('components_player_playeravatar.showalias')"
                      ></v-checkbox>
                      <!-- THIS FEATURE IS WAITING ON BETTER ICONS - DO NOT USE UNTIL NEW ICONS -->
                      <!-- <v-checkbox dense class="alias-checkbox"
                        prepend-icon="$w3info"
                        v-model="userProfile.aliasSettings.showW3info"
                        :label="`Show Warcraft3.info Profile Link`"
                      ></v-checkbox>
                      <v-checkbox dense class="alias-checkbox"
                        prepend-icon="$liquipedia"
                        v-model="userProfile.aliasSettings.showLiquipedia"
                        :label="`Show Liquipedia Page Link`"
                      ></v-checkbox> -->
                    </v-container>
                  </v-row>
                  <v-row no-gutters class="countryInput">
                    <v-col md="12">
                      <v-autocomplete
                        prepend-icon="mdi-flag"
                        clearable
                        :item-value="countryCode"
                        :items="countries"
                        :filter="countryFilter"
                        :label="
                          $t('components_player_playeravatar.selectcountry')
                        "
                        item-text="country"
                        v-model="selectedCountry"
                        :return-object="false"
                      >
                        <template v-slot:item="{ item }">
                          <country-flag
                            :country="item.countryCode"
                            size="normal"
                          />
                          {{ item.country }}
                          <v-spacer></v-spacer>
                        </template>
                        <template v-slot:selection="{ item }">
                          <country-flag
                            :country="item.countryCode"
                            size="normal"
                          />
                          <span class="pr-2">{{ item.country }}</span>
                        </template>
                      </v-autocomplete>
                    </v-col>
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
                        :hint="$t('components_player_playeravatar.aboutdesc')"
                      ></v-textarea>
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="resetUserProfile">
                  {{ $t("components_player_playeravatar.close") }}
                </v-btn>
                <v-btn color="blue darken-1" text @click="saveUserProfile">
                  {{ $t("components_player_playeravatar.save") }}
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
import { ERaceEnum, EAvatarCategory } from "@/store/typings";
import { ECountries } from "@/store/countries";
import {
  AkaSettings,
  SpecialPicture,
} from "../../store/personalSettings/types";
import CountryFlag from "vue-country-flag";
import PlayerSocials from "./PlayerSocials.vue";
import { getAvatarUrl } from "../../helpers/url-functions";
import { enumKeys } from "../../helpers/general"

type CountryType = { country: string; countryCode: string }

@Component({ components: { CountryFlag, PlayerSocials } })
export default class PlayerAvatar extends Vue {
  @Prop() isLoggedInPlayer!: boolean;

  public useClassicIcons = false;

  public dialogOpened = false;
  public races = [
    ERaceEnum.HUMAN,
    ERaceEnum.ORC,
    ERaceEnum.NIGHT_ELF,
    ERaceEnum.UNDEAD,
    ERaceEnum.RANDOM,
  ];

  public countries: CountryType[] = [];
  public picNumbers = Array.from(Array(11).keys());

  get playerGames() {
    return this.personalSetting.winLosses?.reduce((sum, stat) => {
      return sum + stat.games;
    }, 0);
  }

  get homePage(): string {
    return this.personalSetting.homePage || "-";
  }

  get countryCode(): string {
    return this.personalSetting.countryCode || "";
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

  get trovo(): string {
    return this.personalSetting.trovo || "";
  }

  get douyu(): string {
    return this.personalSetting.douyu || "";
  }

  get aliasSettings(): AkaSettings {
    return (
      this.personalSetting.aliasSettings || {
        showAka: true,
        showW3info: true,
        showLiquipedia: true,
      }
    );
  }

  get hasAnAlias(): boolean {
    // If a player opts out of all Alias options, the backend sends data indistinguishable from a player without an alias
    let playerAkaData = this.$store.direct.state.player.playerProfile
      .playerAkaData;

    if (playerAkaData == null) return false;

    if (
      playerAkaData.id != 0 ||
      playerAkaData.name != null ||
      playerAkaData.liquipedia != null
    ) {
      return true; // player has an alias in W3info db, and has NOT opted out of at least one alias option
    }

    return false; // might be opted out - might not have an alias
  }

  get w3infoId(): string|number {
    return this.$store.direct.state.player.playerProfile.playerAkaData.id ?? '';
  }

  get liquipediaString(): string {
    return (
      this.$store.direct.state.player.playerProfile.playerAkaData.liquipedia ??
      ""
    );
  }

  get aliasOrW3infoId(): string {
    let name = this.$store.direct.state.player.playerProfile.playerAkaData.name;

    if (name != null) {
      return name;
    }

    return "";
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

  get specialPictures(): Array<SpecialPicture> {
    return this.personalSetting.specialPictures || [];
  }

  get savedMessageValue(): string {
    return this.personalSetting.profileMessage;
  }

  get personalSetting() {
    return this.$store.direct.state.personalSettings.personalSettings;
  }

  get specialAvatarCategory() {
    return EAvatarCategory.SPECIAL;
  }

  public rules = {
    maxLength: (len: number) => (v: string) =>
      (v || "").length < len || `Can not exceed ${len} characters`,
  };

  public selectedCountry = "";
  public selectedCountryCode = "";

  public userProfile = {
    twitch: this.twitch,
    youtube: this.youtube,
    twitter: this.twitter,
    trovo: this.trovo,
    douyu: this.douyu,
    aliasSettings: this.aliasSettings,
    about: this.savedMessageValue,
    homePage: this.homePage,
    editDialogOpened: false,
  };

  countryFilter(item: CountryType, queryText: string) {
    const textOne = item.country.toLowerCase();
    const searchText = queryText.toLowerCase();
    return textOne.includes(searchText);
  }

  async resetUserProfile() {
    this.userProfile = {
      editDialogOpened: false,
      twitch: this.twitch,
      homePage: this.homePage,
      about: this.savedMessageValue,
      youtube: this.youtube,
      twitter: this.twitter,
      trovo: this.trovo,
      douyu: this.douyu,
      aliasSettings: this.aliasSettings,
    };
  }

  async saveUserProfile() {
    let personalSetting = this.personalSetting;
    personalSetting.profileMessage = this.userProfile.about;
    personalSetting.homePage = this.userProfile.homePage;
    personalSetting.twitch = this.userProfile.twitch;
    personalSetting.youTube = this.userProfile.youtube;
    personalSetting.twitter = this.userProfile.twitter;
    personalSetting.trovo = this.userProfile.trovo;
    personalSetting.douyu = this.userProfile.douyu;
    personalSetting.aliasSettings = this.userProfile.aliasSettings;

    this.countries.map((c) => {
      if (c.country == this.selectedCountry) {
        this.selectedCountry = c.country;
        this.selectedCountryCode = c.countryCode;
      }
    });

    if (!this.selectedCountry) {
      this.selectedCountryCode = "";
    }

    personalSetting.country = this.selectedCountry || "";
    personalSetting.countryCode = this.selectedCountryCode || "";

    await this.$store.direct.dispatch.personalSettings.saveUserProfile(
      personalSetting
    );
    this.userProfile.editDialogOpened = false;
  }

  getCorrectClasses(category: EAvatarCategory, iconId: number) {
    const classes = ["player-avatar-choosing"];
    if (this.isLoggedInPlayer && this.enabledIfEnoughWins(category, iconId))
      classes.push("pointer");

    if (!this.enabledIfEnoughWins(category, iconId))
      classes.push("player-avatar-choosing-disabled");

    return classes;
  }

  get avatarIcon(): number {
    return this.personalSetting?.profilePicture?.pictureId ?? 0;
  }

  get avatarCategory(): EAvatarCategory {
    return this.personalSetting?.profilePicture?.race ?? EAvatarCategory.TOTAL;
  }

  get avatarDescription(): string {
    if (this.avatarCategory != EAvatarCategory.SPECIAL) {
      return "";
    }

    const specialPicture = this.specialPictures.find(
      (x) => x.pictureId == this.avatarIcon
    );
    return specialPicture?.description ?? "";
  }

  enabledIfEnoughWins(category: EAvatarCategory, iconId: number) {
    if (category == EAvatarCategory.SPECIAL) {
      return true;
    }

    const raceCategory = (category) as unknown as ERaceEnum;

    return (
      this.personalSetting.pickablePictures?.filter(
        (r) => r.race == raceCategory
      )[0].max >= iconId
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

  picture(category: EAvatarCategory, picId: number) {
    return getAvatarUrl(category, picId, this.useClassicIcons);
  }

  openDialog() {
    this.dialogOpened = true;
  }

  async savePicture(
    avatarCategory: EAvatarCategory,
    picture: number,
    description?: string
  ) {
    if (!this.enabledIfEnoughWins(avatarCategory, picture)) return;
    await this.$store.direct.dispatch.personalSettings.saveAvatar({
      race: avatarCategory,
      pictureId: picture,
      isClassic: this.useClassicIcons,
      description,
    });

    this.dialogOpened = false;
  }

  goToCountryRankings() {
    this.$router.push(`/Countries?country=${this.selectedCountryCode}`);
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
      trovo: this.trovo,
      douyu: this.douyu,
      aliasSettings: this.aliasSettings,
      editDialogOpened: false,
    };

    this.useClassicIcons =
      this.personalSetting?.profilePicture?.isClassic ?? false;

    // populate countries dropdown for combobox
    enumKeys(ECountries).map((key) => {
      let country = {
        country: key,
        countryCode: ECountries[key],
      };

      if (this.countryCode && this.countryCode == country.countryCode) {
        this.selectedCountry = country.country;
        this.selectedCountryCode = country.countryCode;
      }

      this.countries.push(country);
    });

    if (!this.selectedCountryCode && this.personalSetting?.location) {
      this.selectedCountryCode = this.personalSetting.location;
      
      enumKeys(ECountries).map((key) => {
        const element = ECountries[key] as string;
        if (element == this.selectedCountryCode) {
          this.selectedCountry = key;
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.countryInput {
  margin-left: -11px;
}

.player-country {
  position: absolute;
  border-color: white;
  border-style: solid;
  border-width: thin;
  bottom: 10px;
  right: 10px;
}

.country__container {
  position: relative;
  max-width: 120px;
}

.socialIcon {
  padding-top: 0px;
  padding-left: 2px;
}

.twitchIcon {
  margin-top: 2px;
}

@media (min-width: 960px) {
  .player-avatar {
    height: 185px !important;
  }

  .country__container {
    max-width: 185px !important;
  }
}

.player-avatar {
  max-width: 185px;
  height: 120px;
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

.special-icons {
  .col {
    margin-left: 10px;
  }

  .col:first-child {
    margin-left: 0;
  }
}

.alias-checkbox {
  margin-top: 0px;
  padding-top: 0px;
}
</style>
