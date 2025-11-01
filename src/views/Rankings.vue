<template>
  <v-container class="pa-3 w3-container-width">
    <v-card tile>
      <v-card-title class="pt-3">
        {{ $t("views_app.rankings") }}
      </v-card-title>
      <v-card-text class="pt-2 d-flex">
        <gateway-select
          v-if="isGatewayNeeded"
          @gatewayChanged="onGatewayChanged"
        />
        <game-mode-select
          :gameMode="selectedGameMode"
          @gameModeChanged="onGameModeChanged"
        />
        <v-menu location="right" transition="fade-transition">
          <template v-slot:activator="{ props }">
            <v-btn tile style="background-color: transparent" v-bind="props">
              <league-icon :league="selectedLeagueOrder" />
              {{ selectedLeagueName }}
              {{ selectedLeague.division !== 0 ? selectedLeague.division : null }}
            </v-btn>
          </template>
          <v-card>
            <v-card-text>
              <v-list>
                <v-list-item>
                  <v-list-item-title>
                    {{ $t("views_rankings.selectleague") }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
              <v-divider />
              <v-list density="compact" max-height="400" class="overflow-y-auto" style="max-height: 650px">
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
        <div class="rankings-search-wrapper">
          <v-autocomplete
            v-model="selectedRank"
            v-model:search="search"
            menu-icon=""
            :append-inner-icon="mdiMagnify"
            label="Search"
            :items="searchRanks"
            single-line
            :loading="isLoading"
            :no-data-text="noDataText"
            item-title="player.name"
            item-value="player.id"
            :placeholder="$t(`views_rankings.searchPlaceholder`)"
            bg-color="transparent"
            hide-details
            color="primary"
            icon-color="primary"
            glow
            return-object
            autocomplete="off"
            variant="underlined"
            class="w3-autocomplete"
          >
            <template v-slot:item="{ props, item }">
              <template v-if="item?.raw?.player === undefined">
                {{ item.raw }}
              </template>
              <template v-else>
                <v-list-item>
                  <v-list-item-title v-bind="props">
                    <span v-if="!isDuplicateName(item.raw.player.name)">
                      {{ item.raw.player.name }}
                    </span>
                    <span v-if="isDuplicateName(item.raw.player.name)">
                      {{ item.raw.player.playerIds.map((p: any) => p.battleTag).join(" & ") }}
                    </span>
                    <span v-if="item.raw.player.gameMode === EGameMode.GM_1ON1 && item.raw.player.race">
                      ({{ $t(`racesShort.${ERaceEnum[item.raw.player.race]}`) }})
                    </span>
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="playerIsRanked(item.raw)">
                    {{ $t(`common.wins`) }} {{ item.raw.player.wins }} |
                    {{ $t(`common.losses`) }}
                    {{ item.raw.player.losses }} |
                    {{ $t(`common.total`) }}
                    {{ item.raw.player.games }}
                  </v-list-item-subtitle>
                  <v-list-item-subtitle v-else>
                    {{ $t(`views_rankings.unranked`) }}
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
            </template>
          </v-autocomplete>
        </div>
      </v-card-text>
      <v-menu location="right" transition="fade-transition">
        <template v-slot:activator="{ props }">
          <v-btn tile class="ma-4" style="background-color: transparent" v-bind="props">
            <h2 class="pa-0">
              {{ $t("views_rankings.season") }} {{ selectedSeason.id }}
            </h2>
            <v-icon size="x-large" end>{{ mdiChevronRight }}</v-icon>
          </v-btn>
        </template>
        <v-card>
          <v-card-text>
            <v-list>
              <v-list-item-title>
                {{ $t("views_rankings.prevseasons") }}
              </v-list-item-title>
            </v-list>
            <v-list density="compact" max-height="400" class="overflow-y-auto">
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
          :selectedRank="selectedRank"
        />
        <v-row v-if="showRaceDistribution">
          <v-col cols="12">
            <div class="mt-10">
              <h3 class="pl-5">{{ $t("views_rankings.racedist") }}</h3>
              <rankings-race-distribution :rankings="rankings" />
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref, watch } from "vue";
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
import { useRouter } from "vue-router";
import noop from "lodash/noop";

export default defineComponent({
  name: "RankingsView",
  components: {
    LeagueIcon,
    GatewaySelect,
    GameModeSelect,
    RankingsGrid,
    RankingsRaceDistribution,
  },
  props: {
    season: {
      type: Number,
      required: true,
    },
    league: {
      type: Number,
      required: true,
    },
    gateway: {
      type: Number as PropType<Gateways>,
      required: true,
    },
    gamemode: {
      type: Number as PropType<EGameMode>,
      required: true,
    },
    playerId: {
      type: String,
      required: false,
      default: undefined,
    }
  },
  setup(props) {
    const router = useRouter();
    const rankingsStore = useRankingStore();
    const matchStore = useMatchStore();
    const rootStateStore = useRootStateStore();
    let _intervalRefreshHandle: NodeJS.Timeout;
    let searchTimer: NodeJS.Timeout;

    const search = ref<string>("");
    const selectedRank = ref<Ranking | undefined>(undefined);
    const isLoading = ref<boolean>(false);
    const ongoingMatchesMap = ref<OngoingMatches>({});

    const isGatewayNeeded = computed<boolean>(() => rankingsStore.selectedSeason.id <= 5);
    const selectedSeason = computed<Season>(() => rankingsStore.selectedSeason);
    const seasons = computed<Season[]>(() => rankingsStore.seasons);
    const selectedGameMode = computed<EGameMode>(() => rankingsStore.gameMode);
    const selectedLeagueName = computed<string>(() => !selectedLeague.value?.name ? "" : selectedLeague.value?.name); // FIXME: selectedLeague.value?.name ?? ""
    const rankings = computed<Ranking[]>(() => rankingsStore.rankings);
    const searchRanks = computed<Ranking[]>(() => rankingsStore.searchRanks);
    const showRaceDistribution = computed<boolean>(() => rankingsStore.gameMode == EGameMode.GM_1ON1 && rankingsStore.selectedSeason?.id > 1);

    const ladders = computed<League[]>(() => {
      const league = rankingsStore.ladders?.filter((l) =>
        l.gateway === rootStateStore.gateway
        && l.gameMode === rankingsStore.gameMode
        && l.season === rankingsStore.selectedSeason.id
      )[0];
      return league?.leagues;
    });

    const selectedLeague = computed<League>(() => {
      if (!ladders.value) return {} as League;
      return ladders.value.filter((l) => l.id == rankingsStore.league)[0] || {};
    });

    const selectedLeagueOrder = computed<number>(() => {
      const season = rankingsStore.selectedSeason;
      if (season?.id < 5 && selectedLeague.value?.order > 1) {
        return selectedLeague.value.order + 1;
      }
      return !selectedLeague.value?.order ? 0 : selectedLeague.value?.order;
    });

    // Function to update URL query parameters
    function updateQueryParams() {
      const currentQuery = { ...router.currentRoute.value.query };
      const newQuery = {
        ...currentQuery,
        season: rankingsStore.selectedSeason.id?.toString(),
        gamemode: rankingsStore.gameMode?.toString(),
        league: rankingsStore.league?.toString(),
        gateway: rootStateStore.gateway?.toString(),
      };

      // Only update if the query has changed
      const queryChanged = Object.keys(newQuery).some((key) =>
        newQuery[key as keyof typeof newQuery] !== currentQuery[key]
      );

      if (queryChanged) {
        router.replace({
          name: router.currentRoute.value.name || "Rankings",
          query: newQuery
        }).catch(noop); // Use lodash's noop to handle any potential errors silently
      }
    }

    async function refreshRankings() {
      await loadOngoingMatches();
      await getRankings();
      await getLadders();
    }

    async function getRankings() {
      await rankingsStore.retrieveRankings();
    }

    async function getLadders() {
      await rankingsStore.retrieveLeagueConstellation();
    }

    watch(selectedRank, onSelectedRank);
    function onSelectedRank(rank: Ranking | undefined): void {
      if (!rank) return;

      if (!playerIsRanked(rank)) {
        routeToProfilePage(rank.player.playerIds[0].battleTag);
      }

      setLeague(rank.league);
    }

    watch(searchRanks, onSearchRanksChanged);
    function onSearchRanksChanged() {
      isLoading.value = false;
    }

    const searchDebounced = (newValue: string, timeout = 500) => {
      clearTimeout(searchTimer);
      isLoading.value = true;
      searchTimer = setTimeout(() => {
        rankingsStore.search({ searchText: newValue.toLowerCase(), gameMode: selectedGameMode.value });
      }, timeout);
    };

    watch(search, onSearchChanged);
    function onSearchChanged(newValue: string) {
      if (newValue && newValue.length > 2) {
        searchDebounced(newValue);
      } else {
        rankingsStore.clearSearch();
        isLoading.value = false;
      }
    }

    // Watch for changes in store values to update URL
    watch(() => rankingsStore.selectedSeason, () => {
      updateQueryParams();
    });

    watch(() => rankingsStore.gameMode, () => {
      updateQueryParams();
    });

    watch(() => rankingsStore.league, () => {
      updateQueryParams();
    });

    watch(() => rootStateStore.gateway, () => {
      updateQueryParams();
    });

    function isDuplicateName(name: string): boolean {
      return searchRanks.value.filter((r) => r.player.name === name).length > 1;
    }

    function listLeagueIcon(item: League): number {
      const season = rankingsStore.selectedSeason;
      if (season?.id < 5 && item.order > 1) {
        return item.order + 1;
      }
      return item.order;
    }

    const noDataText = computed<string>(() => {
      if (!search.value || search.value.length < 3) {
        return "Type at least 3 letters";
      }
      if (isLoading.value) {
        return "Loading...";
      }
      return "No player found";
    });

    async function onGatewayChanged() {
      rankingsStore.SET_PAGE(0);
      if (ladders.value && ladders.value[0]) {
        await setLeague(ladders.value[0].id);
      }
    }

    async function onGameModeChanged(gameMode: EGameMode) {
      await rankingsStore.setGameMode(gameMode);
      if (ladders.value && ladders.value[0]) {
        await setLeague(ladders.value[0].id);
      }
    }

    onMounted(async (): Promise<void> => {
      // search.value = "";

      await rankingsStore.retrieveSeasons();

      // Check if season is defined (also allow the value 0), otherwise we can use the first season
      props.season || props.season === 0
        ? rankingsStore.setSeason({ id: props.season })
        : rankingsStore.setSeason(rankingsStore.seasons[0]);

      if (props.league || props.league === 0) {
        rankingsStore.setLeague(props.league);
      }
      if (props.gamemode) {
        await rankingsStore.setGameMode(props.gamemode);
      }
      if (props.gateway) {
        rootStateStore.setGateway(props.gateway);
      }

      await loadOngoingMatches();
      await getLadders();

      if (Array.isArray(ladders.value) && ladders.value.length > 0 && !selectedLeague.value?.id) {
        rankingsStore.setLeague(ladders.value[0].id);
      }

      await getRankings();

      if (props.playerId) {
        const selectedPlayer = rankings.value.find((r) => r.player.id === props.playerId);
        selectedRank.value = selectedPlayer;
      }

      _intervalRefreshHandle = setInterval(async () => {
        await refreshRankings();
      }, AppConstants.ongoingMatchesRefreshInterval);
    });

    onUnmounted((): void => {
      clearInterval(_intervalRefreshHandle);
    });

    async function loadOngoingMatches() {
      await matchStore.loadAllOngoingMatches();

      ongoingMatchesMap.value = {};
      matchStore.allOngoingMatches.forEach((x) => {
        x.teams.forEach((t) => {
          t.players.forEach((p) => {
            const playerTag = p.battleTag;
            const opponentTeams = x.teams.filter((et) => et != t);
            const opponents = opponentTeams.flatMap((ot) => {
              return ot.players.map((y) => y.battleTag);
            });

            ongoingMatchesMap.value[playerTag] = {
              players: t.players.map((y) => y.battleTag),
              opponents: opponents,
            };
          });
        });
      });
    }

    async function selectSeason(season: Season) {
      const previousLeagueId = rankingsStore.league;
      rankingsStore.setSeason(season);
      await getLadders();

      // Try to maintain the same league if it exists in the new season
      let leagueToSelect = 0;
      if (ladders.value && ladders.value.length > 0) {
        const sameLeagueExists = ladders.value.some((league) => league.id === previousLeagueId);
        if (sameLeagueExists) {
          leagueToSelect = previousLeagueId;
        } else {
          leagueToSelect = ladders.value[0].id;
        }
      }

      await setLeague(leagueToSelect);
    }

    async function setLeague(league: number) {
      rankingsStore.setLeague(league);
      await getRankings();
    }

    function playerIsRanked(rank: Ranking): boolean {
      return rank.player.games > 0;
    }

    function routeToProfilePage(playerId: string) {
      router.push({ path: getProfileUrl(playerId) });
    }

    return {
      mdiChevronRight,
      mdiMagnify,
      EGameMode,
      ERaceEnum,
      onGatewayChanged,
      isGatewayNeeded,
      selectedGameMode,
      onGameModeChanged,
      selectedLeagueOrder,
      selectedLeagueName,
      selectedLeague,
      setLeague,
      listLeagueIcon,
      ladders,
      selectedRank,
      searchRanks,
      isLoading,
      search,
      noDataText,
      isDuplicateName,
      playerIsRanked,
      selectedSeason,
      selectSeason,
      seasons,
      rankings,
      ongoingMatchesMap,
      showRaceDistribution,
    };
  },
});
</script>

<style lang="scss" scoped>
.rankings-search-wrapper {
  margin-left: auto;
  width: 45%;
  margin-top: -15px;
  min-width: 100px;
}

.w3-autocomplete {
  :deep(.v-field__input input) {
    cursor: text;
  }
}
</style>
