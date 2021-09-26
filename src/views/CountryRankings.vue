<template>
  <v-container>
    <v-card class="mt-2 search-bar-container" tile>
      <v-card-title class="search-bar">
        <gateway-select @gatewayChanged="onGatewayChanged" />
        <game-mode-select
          :gameMode="selectedGameMode"
          @gameModeChanged="onGameModeChanged"
        ></game-mode-select>
        <v-menu offset-x>
          <template v-slot:activator="{ on }">
            <v-btn tile v-on="on" style="background-color: transparent">
              <div
                class="country-flag__container"
                v-if="selectedCountry.countryCode"
              >
                <country-flag
                  class="country-flag"
                  :country="selectedCountry.countryCode"
                  size="normal"
                />
              </div>
              {{ selectedCountry.country }}
            </v-btn>
          </template>
          <v-card>
            <v-card-text>
              <v-list>
                <v-list-item-content>
                  <v-list-item-title>Select a country:</v-list-item-title>
                </v-list-item-content>
              </v-list>
              <v-divider></v-divider>
              <v-list dense class="countries-list">
                <v-list-item
                  v-for="item in countries"
                  :key="item.countryCode"
                  @click="selectCountry(item.countryCode)"
                >
                  <v-list-item-content>
                    <v-list-item-title>
                      <span class="country-flag__container">
                        <country-flag
                          class="country-flag"
                          :country="item.countryCode"
                          size="normal"
                        />
                      </span>
                      {{ item.country }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-menu>
        <v-spacer></v-spacer>
        <v-menu offset-x>
          <template v-slot:activator="{ on }">
            <v-btn
              tile
              v-on="on"
              class="ma-4"
              style="background-color: transparent"
            >
              <h2 class="pa-0">Season {{ selectedSeason.id }}</h2>
              <v-icon class="ml-4">mdi-chevron-right</v-icon>
            </v-btn>
          </template>
          <v-card>
            <v-card-text>
              <v-list>
                <v-list-item-content>
                  <v-list-item-title>Previous seasons:</v-list-item-title>
                </v-list-item-content>
              </v-list>
              <v-list dense>
                <v-list-item
                  v-for="item in seasons"
                  :key="item.id"
                  @click="selectSeason(item)"
                >
                  <v-list-item-content>
                    <v-list-item-title>Season {{ item.id }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-menu>
      </v-card-title>
      <v-card-text>
        <country-rankings-grid
          v-if="!isLoading"
          :rankings="rankings"
          :ongoingMatches="ongoingMatchesMap"
          :selectedCountry="selectedCountry.countryCode"
        ></country-rankings-grid>
        <div class="text-center my-5">
          <v-progress-circular
            indeterminate
            v-if="isLoading"
          ></v-progress-circular>
        </div>
        <div></div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import {
  CountryRanking,
  Gateways,
  League,
  Ranking,
  Season,
} from "@/store/ranking/types";
import { EGameMode, ERaceEnum, OngoingMatches } from "@/store/typings";
import { Countries } from "@/store/countries";
import CountryFlag from "vue-country-flag";
import LeagueIcon from "@/components/ladder/LeagueIcon.vue";
import GatewaySelect from "@/components/common/GatewaySelect.vue";
import GameModeSelect from "@/components/common/GameModeSelect.vue";
import CountryRankingsGrid from "@/components/ladder/CountryRankingsGrid.vue";
import AppConstants from "../constants";
import { getProfileUrl } from "@/helpers/url-functions";

@Component({
  components: {
    LeagueIcon,
    GatewaySelect,
    GameModeSelect,
    CountryRankingsGrid,
    CountryFlag,
  },
})
export default class CountryRankingsView extends Vue {
  initialized = false;
  ongoingMatchesMap: OngoingMatches = {};
  races = ERaceEnum;
  countries: { country: string; countryCode: string }[] = Countries;

  @Prop() season!: number;
  @Prop() gateway!: Gateways;
  @Prop() country!: string;

  @Watch("country")
  onCountryChanged(newValue: string) {
    this.setCountry(newValue);
  }

  private _intervalRefreshHandle?: number = undefined;

  get selectedCountryCode() {
    return this.$store.direct.state.rankings.selectedCountry;
  }

  get selectedCountry() {
    return (
      this.countries.find((c) => c.countryCode === this.selectedCountryCode) ??
      {}
    );
  }

  get currentCountryCode() {
    // country code of the data being displayed
    return (
      this.rankings[0]?.ranks[0].playersInfo[0].countryCode ||
      this.rankings[0]?.ranks[0].playersInfo[0].location
    );
  }

  get isLoading() {
    return (
      (this.$store.direct.state.rankings.countryRankingsLoading &&
        this.selectedCountryCode !== this.currentCountryCode) ||
      (!this.initialized && this.rankings.length === 0)
    );
  }

  get selectedGameMode() {
    return this.$store.direct.state.rankings.gameMode;
  }

  get selectedSeason() {
    return this.$store.direct.state.rankings.selectedSeason;
  }

  get seasons() {
    return this.$store.direct.state.rankings.seasons;
  }

  get rankings(): CountryRanking[] {
    return this.$store.direct.state.rankings.countryRankings;
  }

  get ladders(): League[] {
    const league = this.$store.direct.state.rankings.ladders?.filter(
      (l) =>
        l.gateway === this.$store.direct.state.gateway &&
        EGameMode.GM_1ON1 &&
        l.season === this.$store.direct.state.rankings.selectedSeason.id
    )[0];
    return league?.leagues;
  }

  public async onGatewayChanged() {
    this.$store.direct.commit.rankings.SET_PAGE(0);
    this.refreshRankings();
  }

  public async onGameModeChanged(gameMode: EGameMode) {
    await this.$store.direct.dispatch.rankings.setGameMode(gameMode);
    this.refreshRankings();
  }

  selectCountry(countryCode: string) {
    this.$router.push(`/Countries?country=${countryCode}`);
  }

  async mounted() {
    window.scrollTo(0, 0);

    if (this.season) {
      this.$store.direct.commit.rankings.SET_SELECTED_SEASON({
        id: this.season,
      });
    }
    if (this.gateway) {
      this.$store.direct.commit.SET_GATEWAY(this.gateway);
    }

    let country =
      this.country || this.selectedCountryCode || this.countries[0].countryCode;

    await this.$store.direct.dispatch.rankings.retrieveSeasons();
    await this.getLadders();
    await this.$store.direct.dispatch.rankings.setCountry(country);
    this.initialized = true;

    await this.loadOngoingMatches();

    this._intervalRefreshHandle = setInterval(async () => {
      await this.refreshRankings();
    }, AppConstants.ongoingMatchesRefreshInterval);
  }

  destroyed() {
    clearInterval(this._intervalRefreshHandle);
  }

  get selectedGateway() {
    return this.$store.direct.state.gateway;
  }

  public async refreshRankings() {
    await this.loadOngoingMatches();

    await this.getLadders();
    await this.getRankings();
  }

  public async getRankings() {
    await this.$store.direct.dispatch.rankings.getCountryRankings();
  }

  public async getLadders() {
    await this.$store.direct.dispatch.rankings.retrieveLeagueConstellation();
  }

  public async loadOngoingMatches() {
    await this.$store.direct.dispatch.matches.loadAllOngoingMatches();

    this.ongoingMatchesMap = {};
    this.$store.direct.state.matches.allOngoingMatches.forEach((x) => {
      x.teams.forEach((t) => {
        t.players.forEach((p) => {
          const playerTag = p.battleTag;
          const opponentTeams = x.teams.filter((et) => et != t);
          const opponents = opponentTeams.flatMap((ot) => {
            return ot.players.map((y) => y.battleTag);
          });

          this.ongoingMatchesMap[playerTag] = {
            players: t.players.map((y) => y.battleTag),
            opponents: opponents,
          };
        });
      });
    });
  }

  async selectSeason(season: Season) {
    await this.$store.direct.dispatch.rankings.setSeason(season);
    await this.$store.direct.dispatch.rankings.setLeague(0);
    this.refreshRankings();
  }

  async setCountry(countryCode: string) {
    await this.$store.direct.dispatch.rankings.setCountry(countryCode);
  }

  public playerIsRanked(rank: Ranking): boolean {
    return rank.player.games > 0;
  }

  public routeToProfilePage(playerId: string) {
    this.$router.push({
      path: getProfileUrl(playerId),
    });
  }
}
</script>
<style lang="scss" scoped>
.countries-list {
  max-height: 650px;
  overflow-y: auto;
}
.country-flag__container {
  margin-right: 10px;
}
.country-flag {
  margin-bottom: -13px !important;
  margin-top: -10px !important;
}
</style>
