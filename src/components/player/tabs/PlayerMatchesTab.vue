<template>
  <div>
    <v-card-title>
      <v-row align="center">
        <v-col cols="12" md="5">
          {{ $t("components_player_tabs_matchhistorytab.title") }}
        </v-col>
        <v-col cols="12" md="5">
          <player-search
            :setAutofocus="false"
            @playerFound="playerFound"
            @searchCleared="searchCleared"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="2">
          <v-select
            class="over-chart-select-box"
            :items="activeGameModesWithAll()"
            item-text="name"
            item-value="id"
            :value="profileMatchesGameMode"
            label="Mode"
            outlined
            @change="setSelectedGameModeForSearch"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            class="player-race-select-box"
            :items="races"
            item-text="raceName"
            item-value="raceId"
            :value="playerRace"
            label="Player Race"
            outlined
            @change="setPlayerRaceForSearch"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            class="opponent-race-select-box"
            :items="races"
            item-text="raceName"
            item-value="raceId"
            :value="opponentRace"
            label="Opponent Race"
            outlined
            @change="setOpponentRaceForSearch"
          />
        </v-col>
        <v-col align-self="center" cols="12" md="3">
          <hero-select
            :is-player-matches-tab="true"
            :selectedHeroes="selectedHeroes"
            @heroChanged="heroChanged"
          />
        </v-col>
        <v-col align-self="center">
          <hero-icon-toggle :showHeroes="showHeroIcons" @update:showHeroes="showHeroIcons = $event" />
        </v-col>
      </v-row>
    </v-card-title>
    <v-card-text v-if="foundPlayer">
      <v-row align="center">
        <v-col cols="12">
          <div>vs. {{ foundPlayer }}</div>
          <span class="won">Wins: {{ opponentWins }}</span>
          /
          <span class="lost">
            Losses: {{ totalMatchesAgainstOpponent - opponentWins }}
          </span>
          <span>({{ winRateVsOpponent }}%)</span>
        </v-col>
      </v-row>
    </v-card-text>
    <matches-grid
      v-model="matches"
      :total-matches="totalMatches"
      :items-per-page="50"
      :always-left-name="battleTag"
      only-show-enemy
      :is-player-profile="true"
      :show-heroes="showHeroIcons"
      :selectedHeroes="selectedHeroes"
      @pageChanged="onPageChanged"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { loadActiveGameModes, activeGameModesWithAll } from "@/composables/GameModesMixin";
import MatchesGrid from "@/components/matches/MatchesGrid.vue";
import { EGameMode, ERaceEnum, Match, PlayerInTeam, Team } from "@/store/types";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { usePlayerStore } from "@/store/player/store";
import { useRankingStore } from "@/store/ranking/store";
import HeroIconToggle from "@/components/matches/HeroIconToggle.vue";
import HeroSelect from "@/components/matches/HeroSelect.vue";
import { useCommonStore } from "@/store/common/store";

export default defineComponent({
  name: "PlayerMatchesTab",
  components: {
    MatchesGrid,
    PlayerSearch,
    HeroIconToggle,
    HeroSelect,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const playerStore = usePlayerStore();
    const rankingsStore = useRankingStore();
    const commonStore = useCommonStore();
    const isLoadingMatches = ref<boolean>(false);
    const foundPlayer = ref<string>("");
    const showHeroIcons = ref<boolean>(true);

    const battleTag = computed<string>(() => decodeURIComponent(props.id));
    const totalMatches = computed<number>(() => playerStore.totalMatches);
    const matches = computed<Match[]>(() => playerStore.matches);
    const profileMatchesGameMode = computed<EGameMode>(() => playerStore.profileMatchesGameMode);
    const playerRace = computed<ERaceEnum | undefined>(() => playerStore.playerRace);
    const opponentRace = computed<ERaceEnum | undefined>(() => playerStore.opponentRace);
    const selectedHeroes = computed<number[]>(() => playerStore.selectedHeroes);

    onMounted(async (): Promise<void> => {
      await loadActiveGameModes();
      await commonStore.loadHeroFilters();
    });

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

    const races = [
      { raceName: t(`races.${ERaceEnum[ERaceEnum.TOTAL]}`), raceId: ERaceEnum.TOTAL },
      { raceName: t(`races.${ERaceEnum[ERaceEnum.HUMAN]}`), raceId: ERaceEnum.HUMAN },
      { raceName: t(`races.${ERaceEnum[ERaceEnum.ORC]}`), raceId: ERaceEnum.ORC },
      { raceName: t(`races.${ERaceEnum[ERaceEnum.NIGHT_ELF]}`), raceId: ERaceEnum.NIGHT_ELF },
      { raceName: t(`races.${ERaceEnum[ERaceEnum.UNDEAD]}`), raceId: ERaceEnum.UNDEAD },
      { raceName: t(`races.${ERaceEnum[ERaceEnum.RANDOM]}`), raceId: ERaceEnum.RANDOM },
    ];

    const winRateVsOpponent = computed<string>(() => {
      if (opponentWins.value == 0) return "0";
      return ((opponentWins.value / matches.value.length) * 100).toFixed(1);
    });

    function setSelectedGameModeForSearch(gameMode: EGameMode): void {
      playerStore.SET_PROFILE_MATCHES_GAME_MODE(gameMode);
      getMatches();
    }

    function setPlayerRaceForSearch(race: ERaceEnum): void {
      playerStore.SET_PLAYER_RACE(race);
      getMatches();
    }

    function setOpponentRaceForSearch(race: ERaceEnum): void {
      playerStore.SET_OPPONENT_RACE(race);
      getMatches();
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
      await playerStore.loadMatches(page);
      isLoadingMatches.value = false;
    }

    async function onPageChanged(page: number): Promise<void> {
      await getMatches(page);
    }

    return {
      activeGameModesWithAll,
      profileMatchesGameMode,
      playerRace,
      opponentRace,
      playerFound,
      searchCleared,
      setSelectedGameModeForSearch,
      races,
      setPlayerRaceForSearch,
      setOpponentRaceForSearch,
      foundPlayer,
      opponentWins,
      totalMatchesAgainstOpponent,
      winRateVsOpponent,
      matches,
      totalMatches,
      battleTag,
      onPageChanged,
      showHeroIcons,
      heroChanged,
      selectedHeroes,
    };
  },
});
</script>

<style lang="scss" scoped>
::v-deep(.v-text-field__details) {
  display: none;
}
</style>
