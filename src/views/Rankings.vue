<template>
  <v-container class="pa-3 w3-container-width">
    <v-card class="overflow-x-auto" tile>
      <v-card-title class="pt-3">
        {{ $t("views_app.rankings") }}
      </v-card-title>
      <v-card-text class="pt-2 pb-0 d-flex align-center flex-wrap">
        <v-menu location="right" transition="fade-transition">
          <template v-slot:activator="{ props }">
            <v-btn tile class="ma-0 mr-3 w3-dropdown-button" style="background-color: transparent" v-bind="props">
              <h2 class="pa-0">
                {{ $t("views_rankings.season") }} {{ selectedSeason.id }}
              </h2>
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
        <gateway-select
          v-if="isGatewayNeeded"
          class="mr-3"
          @gatewayChanged="onGatewayChanged"
        />
        <game-mode-select
          class="mr-3"
          :gameMode="selectedGameMode"
          @gameModeChanged="onGameModeChanged"
        />
        <!-- RP league selector (legacy ranking system) -->
        <v-menu v-if="!isProgressionMode" location="right" transition="fade-transition">
          <template v-slot:activator="{ props }">
            <v-btn tile class="w3-dropdown-button" style="background-color: transparent" v-bind="props">
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
        <!-- Progression tier selector (Grand Master / Master / league + division) -->
        <v-menu v-else location="right" transition="fade-transition">
          <template v-slot:activator="{ props }">
            <v-btn tile class="w3-dropdown-button" style="background-color: transparent" v-bind="props">
              <league-icon :league="selectedTier.league" />
              <span class="text-capitalize">{{ selectedTierLabel }}</span>
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
              <v-list density="compact" class="overflow-y-auto" style="max-height: 650px">
                <template v-for="group in tierGroups" :key="group.league">
                  <v-list-subheader class="text-capitalize d-flex align-center">
                    <league-icon :league="group.league" />
                    {{ group.label }}
                  </v-list-subheader>
                  <v-list-item
                    v-for="tier in group.tiers"
                    :key="tierKey(tier)"
                    :active="tierKey(tier) === tierKey(selectedTier)"
                    @click="selectTier(tier)"
                  >
                    <v-list-item-title class="text-capitalize">
                      {{ tierLabel(tier) }}
                    </v-list-item-title>
                  </v-list-item>
                </template>
              </v-list>
            </v-card-text>
          </v-card>
        </v-menu>
        <!-- Race selector (progression race-split ladders only) -->
        <v-menu v-if="showRaceSelector" location="right" transition="fade-transition">
          <template v-slot:activator="{ props }">
            <v-btn tile class="ml-3 w3-dropdown-button" style="background-color: transparent" v-bind="props">
              <race-icon :race="selectedRace" />
            </v-btn>
          </template>
          <v-card>
            <v-card-text>
              <v-list density="compact">
                <v-list-item
                  v-for="race in races"
                  :key="race"
                  :active="race === selectedRace"
                  @click="selectRace(race)"
                >
                  <v-list-item-title class="d-flex align-center">
                    <race-icon :race="race" />
                    <span class="ml-2">{{ $t(`races.${ERaceEnum[race]}`) }}</span>
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
                <v-list-item v-bind="props">
                  <template v-slot:title>
                    <div class="search-result-row d-flex align-center">
                      <img
                        v-if="showSearchRaceIcon(item.raw)"
                        :src="getSearchRaceIconUrl(item.raw)"
                        :alt="getSearchRaceIconName(item.raw)"
                        class="search-race-icon mr-3"
                      />
                      <div class="d-flex flex-column justify-center">
                        <span v-if="!isDuplicateName(item.raw.player.name)">
                          {{ item.raw.player.name }}
                        </span>
                        <span v-if="isDuplicateName(item.raw.player.name)">
                          <span
                            v-for="(pid, index) in item.raw.player.playerIds"
                            :key="pid.battleTag"
                          >
                            {{ pid.name }}<span class="btag-discriminator">#{{ pid.battleTag.split("#")[1] }}</span><span v-if="index < item.raw.player.playerIds.length - 1"> &amp; </span>
                          </span>
                        </span>
                        <v-list-item-subtitle v-if="playerIsRanked(item.raw)">
                          <span class="w3-won">{{ item.raw.player.wins }}</span>
                          -
                          <span class="w3-lost">{{ item.raw.player.losses }}</span>
                          | MMR: {{ item.raw.player.mmr }}
                        </v-list-item-subtitle>
                        <v-list-item-subtitle v-else>
                          {{ $t(`views_rankings.unranked`) }}
                        </v-list-item-subtitle>
                      </div>
                    </div>
                  </template>
                </v-list-item>
              </template>
            </template>
          </v-autocomplete>
        </div>
      </v-card-text>
      <v-card-text>
        <!-- Apex leaderboard (Grand Master / Master progression tiers) -->
        <template v-if="isApexView">
          <div v-if="isApexLoading" class="d-flex justify-center py-10">
            <v-progress-circular indeterminate color="primary" size="40" />
          </div>
          <apex-leaderboard-grid v-else-if="apexLeaderboard" :apexLeaderboard="apexLeaderboard" />
          <div v-else class="elevation-1">
            <table class="custom-table">
              <tbody>
                <tr>
                  <td colspan="4" class="text-center">
                    {{ $t("components_ladder_apexleaderboardgrid.noplayers") }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <!-- Progression league ladder (league + division progression tiers) -->
        <template v-else-if="isProgressionMode">
          <div v-if="isRankingsLoading" class="d-flex justify-center py-10">
            <v-progress-circular indeterminate color="primary" size="40" />
          </div>
          <progression-ladder-grid v-else :rankings="rankings" />
        </template>
        <!-- RP ladder (legacy ranking system) -->
        <template v-else>
          <div v-if="isRankingsLoading" class="d-flex justify-center py-10">
            <v-progress-circular indeterminate color="primary" size="40" />
          </div>
          <rankings-grid
            v-else
            :rankings="rankings"
            :ongoingMatches="ongoingMatchesMap"
            :selectedRank="selectedRank"
          />
        </template>
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
import { computed, defineComponent, nextTick, onMounted, onUnmounted, type PropType, ref, watch } from "vue";
import type { Gateways, League, Ranking, Season } from "@/store/ranking/types";
import { EGameMode, ERaceEnum, type OngoingMatches } from "@/store/types";
import LeagueIcon from "@/components/ladder/LeagueIcon.vue";
import GatewaySelect from "@/components/common/GatewaySelect.vue";
import GameModeSelect from "@/components/common/GameModeSelect.vue";
import RankingsGrid from "@/components/ladder/RankingsGrid.vue";
import ProgressionLadderGrid from "@/components/ladder/ProgressionLadderGrid.vue";
import ApexLeaderboardGrid from "@/components/ladder/ApexLeaderboardGrid.vue";
import RaceIcon from "@/components/player/RaceIcon.vue";
import RankingsRaceDistribution from "@/components/ladder/RankingsRaceDistribution.vue";
import AppConstants, { getDefaultGatewayForSeason, isGatewayNeededForSeason, RACE_SPLIT_START_SEASON } from "../constants";
import { getProfileUrl } from "@/helpers/url-functions";
import { useRankingStore } from "@/store/ranking/store";
import { useMatchStore } from "@/store/match/store";
import { useRootStateStore } from "@/store/rootState/store";
import { useRankingSystem } from "@/composables/useRankingSystem";
import { type ProgressionTier, isApexTier, progressionTierGroups, tierKey, tierLabel } from "@/helpers/progression-leagues";
import { mdiMagnify } from "@mdi/js";
import { useRouter } from "vue-router";
import noop from "lodash/noop";

export default defineComponent({
  name: "RankingsView",
  components: {
    LeagueIcon,
    GatewaySelect,
    GameModeSelect,
    RankingsGrid,
    ProgressionLadderGrid,
    ApexLeaderboardGrid,
    RaceIcon,
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
    const playerIdToScroll = ref<string | undefined>(undefined);
    const isProgrammaticSelection = ref<boolean>(false);

    const { resolveRankingSystem } = useRankingSystem();
    // The first non-apex tier (Adept I) — the default landing tier for a progression mode.
    const defaultProgressionTier: ProgressionTier = { league: 2, division: 1 };
    const selectedTier = ref<ProgressionTier>(defaultProgressionTier);
    const selectedRace = ref<ERaceEnum>(ERaceEnum.HUMAN);

    const isProgressionMode = computed<boolean>(() =>
      resolveRankingSystem(rankingsStore.gameMode, rankingsStore.selectedSeason.id) === "progression"
    );
    // 1v1 is the only race-split ladder, and only from RACE_SPLIT_START_SEASON onward (mirrors the
    // backend's UsesRaceInLadderKey: race-split mode AND season >= RaceSplitStartSeason).
    const isRaceSplitMode = computed<boolean>(() =>
      rankingsStore.gameMode === EGameMode.GM_1ON1 && rankingsStore.selectedSeason.id >= RACE_SPLIT_START_SEASON
    );
    const showRaceSelector = computed<boolean>(() => isProgressionMode.value && isRaceSplitMode.value);
    const isApexView = computed<boolean>(() => isProgressionMode.value && isApexTier(selectedTier.value));
    // The tier list is static (no reactive deps), so compute it once.
    const tierGroups = progressionTierGroups();
    const selectedTierLabel = computed<string>(() => tierLabel(selectedTier.value));

    const races = [ERaceEnum.HUMAN, ERaceEnum.ORC, ERaceEnum.NIGHT_ELF, ERaceEnum.UNDEAD, ERaceEnum.RANDOM];

    // Progression ladders are global (gateway-agnostic), so the gateway selector is hidden for them.
    const isGatewayNeeded = computed<boolean>(() =>
      !isProgressionMode.value && isGatewayNeededForSeason(rankingsStore.selectedSeason.id)
    );
    const selectedSeason = computed<Season>(() => rankingsStore.selectedSeason);
    const seasons = computed<Season[]>(() => rankingsStore.seasons);
    const selectedGameMode = computed<EGameMode>(() => rankingsStore.gameMode);
    const selectedLeagueName = computed<string>(() => !selectedLeague.value?.name ? "" : selectedLeague.value?.name); // FIXME: selectedLeague.value?.name ?? ""
    const rankings = computed<Ranking[]>(() => rankingsStore.rankings);
    const searchRanks = computed<Ranking[]>(() => rankingsStore.searchRanks);
    const showRaceDistribution = computed<boolean>(() =>
      !isProgressionMode.value && rankingsStore.gameMode == EGameMode.GM_1ON1 && rankingsStore.selectedSeason?.id > 1
    );
    const isRankingsLoading = computed<boolean>(() => rankingsStore.loading);
    const apexLeaderboard = computed(() => rankingsStore.apexLeaderboard);
    const isApexLoading = computed<boolean>(() => rankingsStore.apexLoading);

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
      // Progression modes use their own data sources (apex / progression ladder); the periodic
      // refresh below is for the RP ladder only and would otherwise clobber the progression view.
      if (isProgressionMode.value) {
        return;
      }
      await getRefreshRankings();
      await getLadders();
    }

    async function getRankings() {
      await rankingsStore.retrieveRankings();
    }

    async function getRefreshRankings() {
      await rankingsStore.retrieveRankings(undefined, false);
    }

    async function getLadders() {
      await rankingsStore.retrieveLeagueConstellation();
    }

    watch(selectedRank, onSelectedRank);
    function onSelectedRank(rank: Ranking | undefined): void {
      if (!rank) return;
      // Don't trigger side effects when selectedRank is set programmatically for scrolling
      if (isProgrammaticSelection.value) return;

      // Search returns RP rows with a populated player; in a progression mode the RP setLeague
      // path would overwrite the progression ladder, so route to the player's profile instead.
      // Scroll-to-position within the progression ladder is a follow-up.
      if (isProgressionMode.value) {
        routeToProfilePage(rank.player.playerIds[0].battleTag);
        return;
      }

      if (!playerIsRanked(rank)) {
        routeToProfilePage(rank.player.playerIds[0].battleTag);
        return;
      }

      playerIdToScroll.value = rank.player.playerIds[0]?.battleTag;
      setLeague(rank.league);
    }

    watch(searchRanks, onSearchRanksChanged);
    function onSearchRanksChanged() {
      isLoading.value = false;
    }

    function rankingMatchesPlayerId(rank: Ranking, playerId: string): boolean {
      return rank.player.playerIds.some((player) => player.battleTag === playerId);
    }

    const handlePlayerScroll = async () => {
      if (playerIdToScroll.value && rankings.value.length > 0) {
        await nextTick();
        const selectedPlayer = rankings.value.find((r) => rankingMatchesPlayerId(r, playerIdToScroll.value!));
        if (selectedPlayer) {
          isProgrammaticSelection.value = true;
          selectedRank.value = selectedPlayer;
          playerIdToScroll.value = undefined;
          await nextTick();
          isProgrammaticSelection.value = false;
          const element = document.getElementById(`listitem_${selectedPlayer.rankNumber}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }
    };

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

    function showSearchRaceIcon(rank: Ranking): boolean {
      return rank.player.gameMode === EGameMode.GM_1ON1
        && rank.player.race !== undefined
        && rank.player.race !== null
        && rank.player.race !== ERaceEnum.TOTAL;
    }

    function getSearchRaceIconUrl(rank: Ranking): string {
      const race = rank.player.race;
      if (race === undefined || race === null) {
        return "/assets/raceIcons/RANDOM.png";
      }

      return `/assets/raceIcons/${ERaceEnum[race]}.png`;
    }

    function getSearchRaceIconName(rank: Ranking): string {
      const race = rank.player.race;
      if (race === undefined || race === null) {
        return ERaceEnum[ERaceEnum.RANDOM];
      }

      return ERaceEnum[race];
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
      // Progression modes do not use the RP ladder fetch in setGameMode; set the mode directly
      // and load the progression view (default tier) instead.
      if (resolveRankingSystem(gameMode, rankingsStore.selectedSeason.id) === "progression") {
        rankingsStore.SET_GAME_MODE(gameMode);
        rankingsStore.SET_PAGE(0);
        selectedTier.value = defaultProgressionTier;
        await loadProgressionView();
        return;
      }
      await rankingsStore.setGameMode(gameMode);
      if (ladders.value && ladders.value[0]) {
        await setLeague(ladders.value[0].id);
      }
    }

    onMounted(async (): Promise<void> => {
      const hasSeason = props.season || props.season === 0;
      const hasLeague = props.league || props.league === 0;
      const hasGateway = props.gateway || props.gateway === 0;
      const hasGameMode = props.gamemode || props.gamemode === 0;

      const targetSeason = hasSeason ? props.season : rankingsStore.selectedSeason.id;
      const targetLeague = hasLeague ? props.league : rankingsStore.league;
      const targetGateway = hasGateway ? props.gateway : rootStateStore.gateway;
      const targetGameMode = hasGameMode ? props.gamemode : rankingsStore.gameMode;

      const alreadyLoaded =
        rankingsStore.rankings.length > 0 &&
        rankingsStore.selectedSeason.id === targetSeason &&
        rankingsStore.league === targetLeague &&
        rootStateStore.gateway === targetGateway &&
        rankingsStore.gameMode === targetGameMode;

      // Show spinner immediately before any await if we need to refetch, so stale data is never rendered
      if (!alreadyLoaded) {
        rankingsStore.SET_LOADING(true);
      }

      if (props.playerId) {
        playerIdToScroll.value = props.playerId;
      }

      await rankingsStore.retrieveSeasons();
      await rankingsStore.retrieveActiveGameModes();

      // Check if season is defined (also allow the value 0), otherwise we can use the first season
      if (hasSeason) {
        rankingsStore.setSeason({ id: props.season });
      } else {
        rankingsStore.setSeason(rankingsStore.seasons[0]);
      }

      if (hasLeague) {
        rankingsStore.setLeague(props.league);
      }
      if (hasGateway) {
        rootStateStore.setGateway(props.gateway);
      }

      rootStateStore.setGateway(getDefaultGatewayForSeason(rankingsStore.selectedSeason.id, rootStateStore.gateway));

      await loadOngoingMatches();
      await getLadders();

      if (Array.isArray(ladders.value) && ladders.value.length > 0 && !selectedLeague.value?.id) {
        rankingsStore.setLeague(ladders.value[0].id);
      }

      // Apply the route's game mode to the store before the load branch, so isProgressionMode
      // resolves against the requested mode (not the store default) on a direct URL load / refresh.
      // Plain mutation (no RP fetch here); the branch below performs the actual load.
      if (hasGameMode) {
        rankingsStore.SET_GAME_MODE(props.gamemode);
      }

      if (isProgressionMode.value) {
        // Progression modes render the apex leaderboard or progression league ladder rather than
        // the RP ladder. Start at the default tier and load its view.
        selectedTier.value = defaultProgressionTier;
        await loadProgressionView();
      } else if (alreadyLoaded) {
        // Data is already current — scroll immediately, then silently refresh in background
        await handlePlayerScroll();
        getRefreshRankings();
      } else if (props.gamemode) {
        await rankingsStore.setGameMode(props.gamemode);
        await handlePlayerScroll();
      } else {
        await getRankings();
        await handlePlayerScroll();
      }

      _intervalRefreshHandle = setInterval(() => {
        refreshRankings();
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
      const highlightedPlayerId =
        playerIdToScroll.value ??
        props.playerId ??
        selectedRank.value?.player.playerIds[0]?.battleTag;
      const previousLeagueId = rankingsStore.league;
      rankingsStore.setSeason(season);
      rootStateStore.setGateway(getDefaultGatewayForSeason(season.id, rootStateStore.gateway));
      await getLadders();

      // If the current mode renders the progression system in the newly selected season, load the
      // progression view (reset to the default tier) and skip the RP league selection below.
      if (resolveRankingSystem(rankingsStore.gameMode, season.id) === "progression") {
        selectedTier.value = defaultProgressionTier;
        await loadProgressionView();
        return;
      }

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

      if (highlightedPlayerId) {
        playerIdToScroll.value = highlightedPlayerId;
      }

      await setLeague(leagueToSelect);
    }

    async function setLeague(league: number) {
      rankingsStore.setLeague(league);
      await getRankings();
      await handlePlayerScroll();
    }

    // Load the data for the currently selected progression tier: the apex leaderboard for the
    // Grand Master / Master tiers, otherwise the progression league/division ladder.
    async function loadProgressionView() {
      const season = rankingsStore.selectedSeason.id;
      const gameMode = rankingsStore.gameMode;
      if (isApexView.value) {
        await rankingsStore.retrieveApexLeaderboard(season, gameMode);
        return;
      }
      // Clear any previously loaded apex data so switching back to an apex tier never flashes a
      // stale leaderboard before the fresh fetch resolves.
      rankingsStore.SET_APEX_LEADERBOARD(null);
      const race = showRaceSelector.value ? selectedRace.value : undefined;
      await rankingsStore.retrieveProgressionLadder(
        season,
        gameMode,
        selectedTier.value.league,
        selectedTier.value.division ?? 1,
        race,
      );
    }

    async function selectTier(tier: ProgressionTier) {
      selectedTier.value = tier;
      await loadProgressionView();
    }

    async function selectRace(race: ERaceEnum) {
      selectedRace.value = race;
      await loadProgressionView();
    }

    function playerIsRanked(rank: Ranking): boolean {
      return rank.player.games > 0;
    }

    function routeToProfilePage(playerId: string) {
      router.push({ path: getProfileUrl(playerId) });
    }

    return {
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
      showSearchRaceIcon,
      getSearchRaceIconUrl,
      getSearchRaceIconName,
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
      isRankingsLoading,
      isProgressionMode,
      isApexView,
      apexLeaderboard,
      isApexLoading,
      showRaceSelector,
      selectedRace,
      selectRace,
      races,
      tierGroups,
      selectedTier,
      selectedTierLabel,
      selectTier,
      tierKey,
      tierLabel,
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

.search-race-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  align-self: center;
  flex-shrink: 0;
}

.search-result-row {
  width: 100%;
}

.btag-discriminator {
  color: rgb(var(--v-theme-on-surface), 0.55);
}
</style>
