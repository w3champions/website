<template>
  <div>
    <v-card-title>
      <v-row align="center">
        <v-col cols="12" md="5">
          {{ $t("components_player_tabs_matchhistorytab.title") }}
        </v-col>
        <v-col cols="12" md="5">
          <player-search
            @playerFound="playerFound"
            @searchCleared="searchCleared"
            :setAutofocus="false"
          ></player-search>
        </v-col>
        <v-col>
          <v-btn outlined @click="filtersVisible = !filtersVisible">
            {{ filterButtonText }}
          </v-btn>
        </v-col>
      </v-row>
      <v-row v-show="filtersVisible">
        <v-col cols="12" md="2">
          <v-select
            class="over-chart-select-box"
            :items="activeGameModesWithAT"
            item-text="name"
            item-value="id"
            @change="setSelectedGameModeForSearch"
            label="Mode"
            outlined
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            class="player-race-select-box"
            :items="races"
            item-text="raceName"
            item-value="raceId"
            @change="setPlayerRaceForSearch"
            label="Player Race"
            outlined
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            class="opponent-race-select-box"
            :items="races"
            item-text="raceName"
            item-value="raceId"
            @change="setOpponentRaceForSearch"
            label="Opponent Race"
            outlined
          />
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
      @pageChanged="onPageChanged"
    ></matches-grid>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from "vue-property-decorator";
import GameModesMixin from "@/mixins/GameModesMixin";
import MatchesGrid from "@/components/matches/MatchesGrid.vue";
import { Ranking } from "@/store/ranking/types";
import { EGameMode, ERaceEnum, Match, PlayerInTeam, Team } from "@/store/types";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { useRankingStore } from "@/store/ranking/store";
import { usePlayerStore } from "@/store/player/store";

@Component({ components: { MatchesGrid, PlayerSearch } })
export default class PlayerMatchesTab extends Mixins(GameModesMixin) {
  @Prop() public id!: string;
  public isLoadingMatches = false;
  public gameModeEnums = EGameMode;
  public raceEnums = ERaceEnum;
  public filtersVisible = false;
  public foundPlayer = "";
  private rankingsStore = useRankingStore();
  private player = usePlayerStore();

  async mounted(): Promise<void> {
    await this.loadActiveGameModes();
  }

  async playerFound(bTag: string): Promise<void> {
    this.foundPlayer = bTag;
    this.player.SET_OPPONENT_TAG(bTag);
    await this.getMatches();
  }

  async searchCleared(): Promise<void> {
    this.foundPlayer = "";
    this.player.SET_OPPONENT_TAG("");
    this.rankingsStore.clearSearch();
    await this.getMatches();
  }

  get battleTag() {
    return decodeURIComponent(this.id);
  }

  public async activated() {
    await this.rankingsStore.retrieveSeasons();
    this.rankingsStore.setSeason(this.rankingsStore.seasons[0]);
    setTimeout(async () => await this.getMatches(), 500);
  }

  get races() {
    return [
      {
        raceName: this.$t(`races.${ERaceEnum[ERaceEnum.TOTAL]}`),
        raceId: ERaceEnum.TOTAL,
      },
      {
        raceName: this.$t(`races.${ERaceEnum[ERaceEnum.HUMAN]}`),
        raceId: ERaceEnum.HUMAN,
      },
      {
        raceName: this.$t(`races.${ERaceEnum[ERaceEnum.ORC]}`),
        raceId: ERaceEnum.ORC,
      },
      {
        raceName: this.$t(`races.${ERaceEnum[ERaceEnum.NIGHT_ELF]}`),
        raceId: ERaceEnum.NIGHT_ELF,
      },
      {
        raceName: this.$t(`races.${ERaceEnum[ERaceEnum.UNDEAD]}`),
        raceId: ERaceEnum.UNDEAD,
      },
      {
        raceName: this.$t(`races.${ERaceEnum[ERaceEnum.RANDOM]}`),
        raceId: ERaceEnum.RANDOM,
      },
    ];
  }

  get totalMatches(): number {
    return this.player.totalMatches;
  }

  get matches(): Match[] {
    return this.player.matches;
  }

  get winRateVsOpponent() {
    if (this.opponentWins == 0) {
      return 0;
    }

    return ((this.opponentWins / this.matches.length) * 100).toFixed(1);
  }

  get filterButtonText() {
    if (this.filtersVisible) {
      return "Hide Additional Filters";
    } else {
      return "Show Additional Filters";
    }
  }

  get searchRanks(): Ranking[] {
    return this.rankingsStore.searchRanks;
  }

  public setSelectedGameModeForSearch(gameMode: EGameMode) {
    this.player.SET_GAMEMODE(gameMode);
    this.getMatches();
  }

  public setPlayerRaceForSearch(race: ERaceEnum) {
    this.player.SET_PLAYER_RACE(race);
    this.getMatches();
  }

  public setOpponentRaceForSearch(race: ERaceEnum) {
    this.player.SET_OPPONENT_RACE(race);
    this.getMatches();
  }

  get totalMatchesAgainstOpponent() {
    const opponentTag = this.player.opponentTag;
    if (!opponentTag || !this.matches) {
      return 0;
    }

    const totalMatchesAgainstOpponent = this.matches.filter((match: Match) =>
      match.teams.some((team: Team) => {
        const playerTeamMatch = team.players.some(
          (player: PlayerInTeam) => player.battleTag === this.battleTag
        );

        const otherTeams = match.teams.filter((x) => x != team);

        const opponentIsOnTheOtherTeam = otherTeams.some((otherTeam) => {
          return otherTeam.players.some(
            (player: PlayerInTeam) =>
              player.battleTag === this.player.opponentTag
          );
        });

        return playerTeamMatch && opponentIsOnTheOtherTeam;
      })
    ).length;

    return totalMatchesAgainstOpponent;
  }

  get opponentWins(): number {
    if (this.player.opponentTag.length) {
      return this.matches.filter((match: Match) =>
        match.teams.some((team: Team) => {
          const playerHasWin = team.players.some(
            (player: PlayerInTeam) =>
              player.battleTag === this.battleTag && player.won
          );

          const otherTeams = match.teams.filter((x) => x != team);

          const opponentIsOnTheOtherTeam = otherTeams.some((otherTeam) => {
            return otherTeam.players.some(
              (player: PlayerInTeam) =>
                player.battleTag === this.player.opponentTag
            );
          });

          return playerHasWin && opponentIsOnTheOtherTeam;
        })
      ).length;
    }

    return 0;
  }

  public async getMatches(page?: number) {
    if (this.isLoadingMatches || !this.player.selectedSeason.id) {
      return;
    }

    this.isLoadingMatches = true;
    await this.player.loadMatches(page);
    this.isLoadingMatches = false;
  }

  onPageChanged(page: number) {
    this.getMatches(page);
  }
}
</script>
