<template>
  <div>
    <v-card-title class="pb-0 pt-3">
      <v-row no-gutters align="end">
        <v-col cols="auto" class="pa-0">
          {{ $t("components_player_tabs_matchhistorytab.title") }}
        </v-col>
        <v-spacer />
        <v-col cols="auto" class="pa-0 d-flex justify-end align-end player-match-title-search-col">
          <div class="player-match-search-wrap">
            <player-search
              :key="battleTag"
              :setAutofocus="false"
              :showFloatingLabel="false"
              density="compact"
              searchLabel="Search Opponents"
              @playerFound="playerFound"
              @searchCleared="searchCleared"
            />
          </div>
        </v-col>
      </v-row>
    </v-card-title>
    <v-card-text class="pt-4 pb-3">
      <v-row no-gutters align="end" class="player-match-controls-row">
        <v-col cols="auto" class="pa-0">
          <v-menu location="bottom start" transition="fade-transition">
            <template v-slot:activator="{ props }">
              <v-btn tile class="w3-dropdown-button w-100" style="background-color: transparent" v-bind="props">
                <v-icon size="x-large" start>{{ mdiControllerClassic }}</v-icon>
                {{ selectedGameModeName }}
              </v-btn>
            </template>
            <v-card>
              <v-card-text class="dropdown-menu-content">
                <div class="dropdown-menu-title">Mode</div>
                <v-divider />
                <v-list density="compact" max-height="400" class="overflow-y-auto">
                  <v-list-item
                    v-for="mode in activeGameModesWithAll()"
                    :key="mode.id"
                    @click="setSelectedGameModeForSearch(mode)"
                  >
                    <v-list-item-title>{{ mode.name }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-menu>
        </v-col>
        <v-col cols="auto" class="pa-0">
          <race-select
            label="Player Race"
            prefix="Player"
            :race="playerRace"
            :includeRandom="playerIncludeRandom"
            @raceChanged="setPlayerRaceForSearch"
            @includeRandomChanged="setPlayerIncludeRandom"
          />
        </v-col>
        <v-col cols="auto" class="pa-0">
          <race-select
            label="Opponent Race"
            prefix="Opponent"
            :race="opponentRace"
            :includeRandom="opponentIncludeRandom"
            @raceChanged="setOpponentRaceForSearch"
            @includeRandomChanged="setOpponentIncludeRandom"
          />
        </v-col>
        <v-col cols="auto" class="pa-0">
          <hero-select
            :selectedHeroes="selectedHeroes"
            @heroChanged="heroChanged"
          />
        </v-col>
        <v-col class="pa-0 d-flex justify-end align-end player-match-search-col">
          <table-options-menu />
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-text v-if="foundPlayer">
      <v-row align="center">
        <v-col cols="12">
          <div>vs. {{ foundPlayer }}</div>
          <span class="w3-won">Wins: {{ opponentWins }}</span>
          /
          <span class="w3-lost">
            Losses: {{ totalMatchesAgainstOpponent - opponentWins }}
          </span>
          <span>({{ winRateVsOpponent }}%)</span>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-text v-if="isMatchHistoryLoading" class="d-flex justify-center py-10">
      <v-progress-circular indeterminate color="primary" size="40" />
    </v-card-text>
    <matches-grid
      v-else
      v-model="matches"
      :total-matches="totalMatches"
      :items-per-page="50"
      :always-left-name="battleTag"
      only-show-enemy
      :is-player-profile="true"
      :show-heroes="showHeroIcons"
      :show-relative-start-time="showRelativeStartTime"
      :selectedHeroes="selectedHeroes"
      @pageChanged="onPageChanged"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { loadActiveGameModes, activeGameModesWithAll, type IGameModeBrief } from "@/composables/GameModesMixin";
import MatchesGrid from "@/components/matches/MatchesGrid.vue";
import { EGameMode, ERaceEnum, type Match, type PlayerInTeam, type Team } from "@/store/types";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { usePlayerStore } from "@/store/player/store";
import { useRankingStore } from "@/store/ranking/store";
import HeroSelect from "@/components/matches/HeroSelect.vue";
import { useCommonStore } from "@/store/common/store";
import { mdiControllerClassic } from "@mdi/js";
import TableOptionsMenu from "@/components/matches/TableOptionsMenu.vue";
import RaceSelect from "@/components/common/RaceSelect.vue";
import { useTableOptionsStore } from "@/store/tableOptions/store";

export default defineComponent({
  name: "PlayerMatchesTab",
  components: {
    MatchesGrid,
    PlayerSearch,
    HeroSelect,
    TableOptionsMenu,
    RaceSelect,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const playerStore = usePlayerStore();
    const rankingsStore = useRankingStore();
    const commonStore = useCommonStore();
    const tableOptionsStore = useTableOptionsStore();
    const isLoadingMatches = ref<boolean>(false);
    const foundPlayer = ref<string>("");
    const hasResolvedInitialMatches = ref<boolean>(false);

    const battleTag = computed<string>(() => decodeURIComponent(props.id));
    const totalMatches = computed<number>(() => playerStore.totalMatches);
    const matches = computed<Match[]>(() => playerStore.matches);
    const selectedHeroes = computed<number[]>(() => playerStore.selectedHeroes);
    const showHeroIcons = computed<boolean>(() => tableOptionsStore.showHeroes);
    const showRelativeStartTime = computed<boolean>(() => tableOptionsStore.showRelativeStartTime);
    const selectedGameModeName = ref<string>("All Modes");

    const playerRace = computed<ERaceEnum>(() => playerStore.playerRace ?? ERaceEnum.TOTAL);
    const opponentRace = computed<ERaceEnum>(() => playerStore.opponentRace ?? ERaceEnum.TOTAL);

    const playerIncludeRandom = computed({
      get: () => !!playerStore.playerIncludeRandom,
      set: (val: boolean) => playerStore.SET_PLAYER_INCLUDE_RANDOM(val)
    });

    const opponentIncludeRandom = computed({
      get: () => !!playerStore.opponentIncludeRandom,
      set: (val: boolean) => playerStore.SET_OPPONENT_INCLUDE_RANDOM(val)
    });

    watch(
      [playerIncludeRandom, opponentIncludeRandom],
      () => {
        getMatches();
      },
      { flush: "post" }
    );

    const isMatchHistoryLoading = computed<boolean>(() => {
      return !hasResolvedInitialMatches.value
        || playerStore.loadingProfile
        || playerStore.loadingRecentMatches
        || isLoadingMatches.value;
    });

    onMounted(async (): Promise<void> => {
      await loadActiveGameModes();
      await commonStore.loadHeroFilters();

      if (
        playerStore.playerProfile?.battleTag === battleTag.value
        && !playerStore.loadingProfile
        && !playerStore.loadingRecentMatches
      ) {
        hasResolvedInitialMatches.value = true;
      }
    });

    onBeforeRouteLeave((): void => {
      resetProfileMatchFilters();
    });

    watch(battleTag, (newBattleTag: string, oldBattleTag: string | undefined): void => {
      if (!oldBattleTag || newBattleTag === oldBattleTag) return;
      hasResolvedInitialMatches.value = false;
      resetProfileMatchFilters();
    });

    watch(() => playerStore.loadingRecentMatches, (isLoading, wasLoading): void => {
      if (wasLoading && !isLoading) {
        hasResolvedInitialMatches.value = true;
      }
    });

    watch(() => playerStore.loadingProfile, (isLoading, wasLoading): void => {
      if (wasLoading && !isLoading) {
        hasResolvedInitialMatches.value = true;
      }
    });

    function resetProfileMatchFilters(): void {
      foundPlayer.value = "";
      rankingsStore.clearSearch();
      playerStore.RESET_PROFILE_MATCH_FILTERS();
    }

    async function playerFound(bTag: string): Promise<void> {
      foundPlayer.value = bTag;
      playerStore.SET_OPPONENT_TAG(bTag);
      await getMatches();
    }

    async function searchCleared(): Promise<void> {
      foundPlayer.value = "";
      playerStore.SET_OPPONENT_TAG("");
      rankingsStore.clearSearch();
      await getMatches();
    }

    const winRateVsOpponent = computed<string>(() => {
      if (opponentWins.value == 0) return "0";
      return ((opponentWins.value / matches.value.length) * 100).toFixed(1);
    });

    function setSelectedGameModeForSearch(mode: IGameModeBrief): void {
      const gameMode = Number.isNaN(mode.id) ? EGameMode.UNDEFINED : mode.id;
      playerStore.SET_PROFILE_MATCHES_GAME_MODE(gameMode);

      if (gameMode === EGameMode.UNDEFINED) {
        selectedGameModeName.value = "All Modes";
      } else {
        selectedGameModeName.value = mode.name?.toString() ?? selectedGameModeName.value;
      }

      getMatches();
    }

    function setPlayerRaceForSearch(race: ERaceEnum): void {
      playerStore.SET_PLAYER_RACE(race);
      if (race === ERaceEnum.TOTAL || race === ERaceEnum.RANDOM) {
        playerStore.SET_PLAYER_INCLUDE_RANDOM(false);
      }
      getMatches();
    }

    function setOpponentRaceForSearch(race: ERaceEnum): void {
      playerStore.SET_OPPONENT_RACE(race);
      if (race === ERaceEnum.TOTAL || race === ERaceEnum.RANDOM) {
        playerStore.SET_OPPONENT_INCLUDE_RANDOM(false);
      }
      getMatches();
    }

    // Assigning through the computed keeps the watch above in charge of reloading.
    function setPlayerIncludeRandom(value: boolean): void {
      playerIncludeRandom.value = value;
    }

    function setOpponentIncludeRandom(value: boolean): void {
      opponentIncludeRandom.value = value;
    }

    function heroChanged(heroes: number[]): void {
      playerStore.SET_SELECTED_HEROES(heroes);
      getMatches();
    }

    const totalMatchesAgainstOpponent = computed<number>(() => {
      const opponentTag = playerStore.opponentTag;

      if (!opponentTag || !matches.value) return 0;

      const totalMatchesAgainstOpponent = matches.value.filter((match: Match) =>
        match.teams.some((team: Team) => {
          const playerTeamMatch = team.players.some(
            (player: PlayerInTeam) => player.battleTag === battleTag.value
          );

          const otherTeams = match.teams.filter((x) => x != team);

          const opponentIsOnTheOtherTeam = otherTeams.some((otherTeam) => {
            return otherTeam.players.some(
              (player: PlayerInTeam) =>
                player.battleTag === playerStore.opponentTag
            );
          });

          return playerTeamMatch && opponentIsOnTheOtherTeam;
        })
      ).length;

      return totalMatchesAgainstOpponent;
    });

    const opponentWins = computed<number>(() => {
      if (!playerStore.opponentTag.length) return 0;
      return matches.value.filter((match: Match) =>
        match.teams.some((team: Team) => {
          const playerHasWin = team.players.some(
            (player: PlayerInTeam) =>
              player.battleTag === battleTag.value && player.won
          );

          const otherTeams = match.teams.filter((x) => x != team);

          const opponentIsOnTheOtherTeam = otherTeams.some((otherTeam) => {
            return otherTeam.players.some(
              (player: PlayerInTeam) =>
                player.battleTag === playerStore.opponentTag
            );
          });

          return playerHasWin && opponentIsOnTheOtherTeam;
        })
      ).length;
    });

    async function getMatches(page?: number): Promise<void> {
      if (isLoadingMatches.value || !playerStore.selectedSeason.id) {
        return;
      }

      isLoadingMatches.value = true;
      try {
        await playerStore.loadMatches(page);
      } finally {
        isLoadingMatches.value = false;
        hasResolvedInitialMatches.value = true;
      }
    }

    async function onPageChanged(page: number): Promise<void> {
      await getMatches(page);
    }

    return {
      activeGameModesWithAll,
      playerFound,
      searchCleared,
      setSelectedGameModeForSearch,
      playerRace,
      opponentRace,
      setPlayerRaceForSearch,
      setOpponentRaceForSearch,
      setPlayerIncludeRandom,
      setOpponentIncludeRandom,
      selectedGameModeName,
      mdiControllerClassic,
      foundPlayer,
      opponentWins,
      totalMatchesAgainstOpponent,
      winRateVsOpponent,
      isMatchHistoryLoading,
      matches,
      totalMatches,
      battleTag,
      onPageChanged,
      showHeroIcons,
      showRelativeStartTime,
      heroChanged,
      selectedHeroes,
      playerIncludeRandom,
      opponentIncludeRandom,
    };
  },
});
</script>

<style lang="scss" scoped>
.player-match-search-col {
  margin-left: 12px;
}

.player-match-title-search-col {
  width: 250px;
  max-width: 100%;
}

.player-match-search-wrap {
  width: 250px;
  max-width: 100%;
}

.player-match-search-col :deep(.w3-autocomplete) {
  width: 100%;
}

@media (min-width: 960px) {
  .player-match-controls-row {
    flex-wrap: nowrap;
  }
}
</style>
