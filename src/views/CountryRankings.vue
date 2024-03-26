<template>
  <v-container>
    <v-card class="mt-2 search-bar-container" tile>
      <v-card-title class="search-bar">
        <gateway-select
          @gatewayChanged="onGatewayChanged"
          v-if="isGatewayNeeded()"
        />
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
              <v-icon class="ml-4">{{ mdiChevronRight }}</v-icon>
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
import { Component, Prop, Watch, Vue } from "vue-facing-decorator";
import {
  CountryRanking,
  Gateways,
  League,
  Ranking,
  Season,
} from "@/store/ranking/types";
import { EGameMode, ERaceEnum, OngoingMatches } from "@/store/types";
import { Countries } from "@/store/countries";
import LeagueIcon from "@/components/ladder/LeagueIcon.vue";
import GatewaySelect from "@/components/common/GatewaySelect.vue";
import GameModeSelect from "@/components/common/GameModeSelect.vue";
import CountryRankingsGrid from "@/components/ladder/CountryRankingsGrid.vue";
import AppConstants from "../constants";
import { getProfileUrl } from "@/helpers/url-functions";
import { useRankingStore } from "@/store/ranking/store";
import { useMatchStore } from "@/store/match/store";
import { useRootStateStore } from "@/store/rootState/store";
import { mdiChevronRight } from "@mdi/js";

// Lazy load.
const CountryFlag = () => import(/* webpackChunkName: "country-flag" */ "vue-country-flag");

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
  private rankingsStore = useRankingStore();
  public mdiChevronRight = mdiChevronRight;

  @Prop() season!: number;
  @Prop() gateway!: Gateways;
  @Prop() country!: string;
  private matchStore = useMatchStore();
  private rootStateStore = useRootStateStore();

  @Watch("country")
  onCountryChanged(newValue: string) {
    this.setCountry(newValue);
  }

  private _intervalRefreshHandle?: number = undefined;

  get selectedCountryCode() {
    return this.rankingsStore.selectedCountry;
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
      (this.rankingsStore.countryRankingsLoading &&
        this.selectedCountryCode !== this.currentCountryCode) ||
      (!this.initialized && this.rankings.length === 0)
    );
  }

  get selectedGameMode() {
    return this.rankingsStore.gameMode;
  }

  get selectedSeason() {
    return this.rankingsStore.selectedSeason;
  }

  get seasons() {
    return this.rankingsStore.seasons;
  }

  get rankings(): CountryRanking[] {
    return this.rankingsStore.countryRankings;
  }

  get ladders(): League[] {
    const league = this.rankingsStore.ladders?.filter(
      (l) =>
        l.gateway === this.rootStateStore.gateway &&
        EGameMode.GM_1ON1 &&
        l.season === this.rankingsStore.selectedSeason.id
    )[0];
    return league?.leagues;
  }

  public async onGatewayChanged() {
    this.rankingsStore.SET_PAGE(0);
    this.refreshRankings();
  }

  public isGatewayNeeded() {
    return this.rankingsStore.selectedSeason.id <= 5;
  }

  public async onGameModeChanged(gameMode: EGameMode) {
    await this.rankingsStore.setGameMode(gameMode);
    this.refreshRankings();
  }

  selectCountry(countryCode: string) {
    this.$router.push(`/Countries?country=${countryCode}`);
  }

  async mounted() {
    window.scrollTo(0, 0);
    await this.rankingsStore.retrieveSeasons();

    this.season
      ? this.rankingsStore.setSeason({ id: this.season })
      : this.rankingsStore.setSeason(this.rankingsStore.seasons[0]);

    if (this.gateway) {
      this.rootStateStore.SET_GATEWAY(this.gateway);
    }

    const country =
      this.country || this.selectedCountryCode || this.countries[0].countryCode;

    await this.getLadders();
    await this.rankingsStore.setCountry(country);
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
    return this.rootStateStore.gateway;
  }

  public async refreshRankings() {
    await this.loadOngoingMatches();

    await this.getLadders();
    await this.getRankings();
  }

  public async getRankings() {
    await this.rankingsStore.getCountryRankings();
  }

  public async getLadders() {
    await this.rankingsStore.retrieveLeagueConstellation();
  }

  public async loadOngoingMatches() {
    await this.matchStore.loadAllOngoingMatches();

    this.ongoingMatchesMap = {};
    this.matchStore.allOngoingMatches.forEach((x) => {
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
    this.rankingsStore.setSeason(season);
    this.refreshRankings();
  }

  async setCountry(countryCode: string) {
    await this.rankingsStore.setCountry(countryCode);
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
