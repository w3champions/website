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
            <v-btn tile v-on="on" class="transparent">
              <league-icon :league="selectedLeageueOrder" />
              {{ selectedLeagueName }}
              {{
                selectedLeague.division !== 0 ? selectedLeague.division : null
              }}
            </v-btn>
          </template>
          <v-card>
            <v-card-text>
              <v-list>
                <v-list-item-title>
                  {{ $t("views_rankings.selectleague") }}
                </v-list-item-title>
              </v-list>
              <v-divider></v-divider>
              <v-list dense class="leagues-list">
                <v-list-item
                  v-for="item in ladders"
                  :key="item.id"
                  @click="setLeague(item.id)"
                >
                  <v-list-item-title>
                    <league-icon :league="listLeagueIcon(item)" />
                    {{ item.name }}
                    {{ item.division !== 0 ? item.division : null }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-menu>
        <v-spacer></v-spacer>
        <v-autocomplete
          v-model::search-input.sync="searchModel"
          :append-icon="mdiMagnify"
          label="Search"
          single-line
          clearable
          :items="searchRanks"
          :loading="isLoading"
          :no-data-text="noDataText"
          item-text="player.name"
          item-value="player.id"
          :placeholder="$t(`views_rankings.searchPlaceholder`)"
          return-object
        >
          <template v-slot:item="data">
            <template v-if="typeof data.item !== 'object'">
              {{ data.item }}
            </template>
            <template v-else>
              <v-list-item-title>
                <span v-if="!isDuplicateName(data.item.player.name)">
                  {{ data.item.player.name }}
                </span>
                <span v-if="isDuplicateName(data.item.player.name)">
                  {{
                    data.item.player.playerIds
                      .map((p) => p.battleTag)
                      .join(" & ")
                  }}
                </span>
                <span
                  v-if="
                    data.item.player.gameMode === gameModes.GM_1ON1 &&
                    data.item.player.race
                  "
                >
                  ({{ $t(`racesShort.${races[data.item.player.race]}`) }})
                </span>
              </v-list-item-title>
              <v-list-item-subtitle v-if="playerIsRanked(data.item)">
                {{ $t(`common.wins`) }} {{ data.item.player.wins }} |
                {{ $t(`common.losses`) }}
                {{ data.item.player.losses }} |
                {{ $t(`common.total`) }}
                {{ data.item.player.games }}
              </v-list-item-subtitle>
              <v-list-item-subtitle v-else>
                {{ $t(`views_rankings.unranked`) }}
              </v-list-item-subtitle>
            </template>
          </template>
        </v-autocomplete>
      </v-card-title>
      <v-menu offset-x>
        <template v-slot:activator="{ on }">
          <v-btn tile v-on="on" class="ma-4 transparent">
            <h2 class="pa-0">
              {{ $t("views_rankings.season") }} {{ selectedSeason.id }}
            </h2>
            <v-icon class="ml-4">{{ mdiChevronRight }}</v-icon>
          </v-btn>
        </template>
        <v-card>
          <v-card-text>
            <v-list>
              <v-list-item-title>
                {{ $t("views_rankings.prevseasons") }}
              </v-list-item-title>
            </v-list>
            <v-list dense>
              <v-list-item
                v-for="item in seasons"
                :key="item.id"
                @click="selectSeason(item)"
              >
                <v-list-item-title>
                  {{ $t("views_rankings.season") }} {{ item.id }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-menu>
      <v-card-text>
        <rankings-grid
          :rankings="rankings"
          :ongoingMatches="ongoingMatchesMap"
          :selectedRank="searchModel"
        ></rankings-grid>
        <v-row v-if="showRaceDistribution">
          <v-col cols="12">
            <div class="mt-10">
              <h3 class="pl-5">{{ $t("views_rankings.racedist") }}</h3>
              <rankings-race-distribution
                :rankings="rankings"
              ></rankings-race-distribution>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-row>
      <v-col cols="12" md="3" v-if="false">
        <v-card tile>
          <v-card-title>{{ $t("views_rankings.stats") }}</v-card-title>
          <v-list class="transparent">
            <v-list-item v-for="(stat, index) in stats" :key="index">
              <v-list-item-title>{{ stat.name }}</v-list-item-title>
              <v-list-item-subtitle class="text-right">
                {{ stat.value }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Prop, Watch, Vue } from "vue-facing-decorator";
import { Gateways, League, Ranking, Season } from "@/store/ranking/types";
import { EGameMode, ERaceEnum, OngoingMatches } from "@/store/types";
import LeagueIcon from "@/components/ladder/LeagueIcon.vue";
import GatewaySelect from "@/components/common/GatewaySelect.vue";
import GameModeSelect from "@/components/common/GameModeSelect.vue";
import RankingsGrid from "@/components/ladder/RankingsGrid.vue";
import RankingsRaceDistribution from "@/components/ladder/RankingsRaceDistribution.vue";
import AppConstants from "../constants";
import { getProfileUrl } from "@/helpers/url-functions";
import { useRankingStore } from "@/store/ranking/store";
import { useMatchStore } from "@/store/match/store";
import { useRootStateStore } from "@/store/rootState/store";
import { mdiChevronRight, mdiMagnify } from "@mdi/js";

@Component({
  components: {
    LeagueIcon,
    GatewaySelect,
    GameModeSelect,
    RankingsGrid,
    RankingsRaceDistribution,
  },
})
export default class RankingsView extends Vue {
  public search = "";
  public searchModel = {} as Ranking;
  public isLoading = false;
  public ongoingMatchesMap: OngoingMatches = {};
  public gameModes = EGameMode;
  public races = ERaceEnum;
  private searchTimer: ReturnType<typeof setTimeout> = 0;
  public mdiMagnify = mdiMagnify;
  public mdiChevronRight = mdiChevronRight;

  @Prop() public season!: number;
  @Prop() public league!: number;
  @Prop() public gateway!: Gateways;
  @Prop() public gamemode!: EGameMode;
  @Prop({ default: "" })
  public playerId!: string;

  private _intervalRefreshHandle?: number = undefined;
  private rankingsStore = useRankingStore();
  private matchStore = useMatchStore();
  private rootStateStore = useRootStateStore();

  @Watch("searchModel")
  public onSearchModelChanged(rank: Ranking) {
    if (!rank) return;

    if (!this.playerIsRanked(rank)) {
      this.routeToProfilePage(rank.player.playerIds[0].battleTag);
    }

    this.setLeague(rank.league);
  }

  @Watch("searchRanks")
  public onSearchRanksChanged() {
    this.isLoading = false;
  }

  @Watch("search")
  public onSearchChanged(newValue: string) {
    const searchDebounced = (timeout = 500) => {
      clearTimeout(this.searchTimer);
      this.isLoading = true;
      this.searchTimer = setTimeout(() => {
        this.rankingsStore.search({
          searchText: newValue.toLowerCase(),
          gameMode: this.selectedGameMode,
        });
      }, timeout);
    };

    if (newValue && newValue.length > 2) {
      searchDebounced();
    } else {
      this.rankingsStore.clearSearch();
      this.isLoading = false;
    }
  }

  public isDuplicateName(name: string) {
    return this.searchRanks.filter((r) => r.player.name === name).length > 1;
  }

  public isGatewayNeeded() {
    return this.rankingsStore.selectedSeason.id <= 5;
  }

  get selectedSeason() {
    return this.rankingsStore.selectedSeason;
  }

  get seasons() {
    return this.rankingsStore.seasons;
  }

  get selectedGameMode() {
    return this.rankingsStore.gameMode;
  }

  get selectedLeague(): League {
    if (!this.ladders) return {} as League;

    return (
      this.ladders.filter(
        (l) => l.id == this.rankingsStore.league
      )[0] || {}
    );
  }

  get selectedLeagueName(): string {
    return !this.selectedLeague?.name ? "" : this.selectedLeague?.name;
  }

  get selectedLeageueOrder(): number {
    const season = this.rankingsStore.selectedSeason;
    if (season?.id < 5 && this.selectedLeague?.order > 1) {
      return this.selectedLeague.order + 1;
    }
    return !this.selectedLeague?.order ? 0 : this.selectedLeague?.order;
  }

  listLeagueIcon(item: League): number {
    const season = this.rankingsStore.selectedSeason;
    if (season?.id < 5 && item.order > 1) {
      return item.order + 1;
    }
    return item.order;
  }

  get noDataText(): string {
    if (!this.search || this.search.length < 3) {
      return "Type at least 3 letters";
    }
    if (this.isLoading) {
      return "Loading...";
    }

    return "No player found";
  }

  get rankings(): Ranking[] {
    return this.rankingsStore.rankings;
  }

  get ladders(): League[] {
    const league = this.rankingsStore.ladders?.filter(
      (l) =>
        l.gateway === this.rootStateStore.gateway &&
        l.gameMode === this.rankingsStore.gameMode &&
        l.season === this.rankingsStore.selectedSeason.id
    )[0];
    return league?.leagues;
  }

  get searchRanks(): Ranking[] {
    return this.rankingsStore.searchRanks;
  }

  get showRaceDistribution() {
    return (
      this.rankingsStore.gameMode == EGameMode.GM_1ON1 &&
      this.rankingsStore.selectedSeason?.id > 1
    );
  }

  public async onGatewayChanged() {
    this.rankingsStore.SET_PAGE(0);

    if (this.ladders && this.ladders[0]) {
      await this.setLeague(this.ladders[0].id);
    }
  }

  public async onGameModeChanged(gameMode: EGameMode) {
    await this.rankingsStore.setGameMode(gameMode);
    if (this.ladders && this.ladders[0]) {
      await this.setLeague(this.ladders[0].id);
    }
  }

  async mounted() {
    this.search = "";

    await this.rankingsStore.retrieveSeasons();

    this.season
      ? this.rankingsStore.setSeason({ id: this.season })
      : this.rankingsStore.setSeason(this.rankingsStore.seasons[0]);

    if (this.league) {
      this.rankingsStore.setLeague(this.league);
    }
    if (this.gamemode) {
      await this.rankingsStore.setGameMode(this.gamemode);
    }
    if (this.gateway) {
      this.rootStateStore.setGateway(this.gateway);
    }

    await this.loadOngoingMatches();
    await this.getLadders();

    if (this.ladders && !this.selectedLeague?.id) {
      this.rankingsStore.setLeague(this.ladders[0].id);
    }

    await this.getRankings();

    if (this.playerId) {
      const selectedPlayer = this.rankings.find(
        (r) => r.player.id === this.playerId
      );
      this.searchModel = selectedPlayer ?? ({} as Ranking);
    }

    this._intervalRefreshHandle = setInterval(async () => {
      await this.refreshRankings();
    }, AppConstants.ongoingMatchesRefreshInterval);
  }

  destroyed(): void {
    clearInterval(this._intervalRefreshHandle);
  }

  get selectedGateway() {
    return this.rootStateStore.gateway;
  }

  public async refreshRankings() {
    await this.loadOngoingMatches();

    await this.getRankings();
    await this.getLadders();
  }

  public async getRankings() {
    await this.rankingsStore.retrieveRankings();
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

  public async selectSeason(season: Season) {
    this.rankingsStore.setSeason(season);
    await this.getLadders();
    await this.setLeague(0);
  }

  public async setLeague(league: number) {
    this.rankingsStore.setLeague(league);
    await this.getRankings();
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
.leagues-list {
  max-height: 650px;
  overflow-y: auto;
}
</style>
