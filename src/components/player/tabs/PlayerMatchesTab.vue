<template>
  <div>
    <v-card-title>
      <v-row align="center">
        <v-col cols="12" md="5">
          {{ $t("components_player_tabs_matchhistorytab.title") }}
        </v-col>
        <v-col cols="12" md="5">
          <v-autocomplete
            v-model="searchModel"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            clearable
            :items="searchRanks"
            :loading="isLoading"
            :search-input.sync="search"
            :no-data-text="noDataText"
            item-text="player.name"
            item-value="player.id"
            placeholder="Search an opponent"
            return-object
          >
            <template v-slot:item="data">
              <template v-if="typeof data.item !== 'object'">
                <v-list-item-content v-text="data.item"></v-list-item-content>
              </template>
              <template v-else>
                <v-list-item-content>
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
                      v-if="data.item.player.gameMode === gameModeEnums.GM_1ON1"
                    >
                      {{ $t(`races.${raceEnums[data.item.player.race]}`) }}
                    </span>
                    <span
                      v-if="
                        selectedGameModeForSearch === gameModeEnums.UNDEFINED
                      "
                    >
                      ({{
                        $t(
                          `gameModes.${
                            gameModeEnums[data.item.player.gameMode]
                          }`
                        )
                      }})
                    </span>
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    {{ $t("common.wins") }} {{ data.item.player.wins }} |
                    {{ $t("common.losses") }}
                    {{ data.item.player.losses }} |
                    {{ $t("common.total") }}
                    {{ data.item.player.games }}
                  </v-list-item-subtitle>
                </v-list-item-content>
              </template>
            </template>
          </v-autocomplete>
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
            :items="gameModes"
            item-text="modeName"
            item-value="modeId"
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
    <v-card-text v-if="searchModel && searchModel.player">
      <v-row align="center">
        <v-col cols="12">
          <div>vs. {{ searchModel.player.name }}</div>
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
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import MatchesGrid from "@/components/matches/MatchesGrid.vue";
import { Ranking } from "@/store/ranking/types";
import {
  EGameMode,
  ERaceEnum,
  Match,
  PlayerInTeam,
  Team,
} from "@/store/typings";

@Component({ components: { MatchesGrid } })
export default class PlayerMatchesTab extends Vue {
  @Prop() public id!: string;
  public searchModel = {} as Ranking;
  public search = "";
  public isLoadingMatches = false;
  public isLoading = false;
  public gameModeEnums = EGameMode;
  public raceEnums = ERaceEnum;
  public filtersVisible = false;
  private searchTimer: ReturnType<typeof setTimeout> = 0;

  @Watch("searchModel")
  public onSearchModelChanged(newVal?: Ranking) {
    if (newVal) {
      this.$store.direct.commit.player.SET_OPPONENT_TAG(
        `${newVal.player.playerIds[0].battleTag}`
      );
    } else {
      this.$store.direct.commit.player.SET_OPPONENT_TAG("");
    }
    this.getMatches();
  }

  @Watch("searchRanks")
  public onSearchRanksChanged() {
    this.isLoading = false;
  }

  get battleTag() {
    return decodeURIComponent(this.id);
  }

  public async activated() {
    await this.$store.direct.dispatch.rankings.retrieveSeasons();
    this.$store.direct.dispatch.rankings.setSeason(this.$store.direct.state.rankings.seasons[0]);
    setTimeout(async () => await this.getMatches(), 500);
  }

  @Watch("search")
  public onSearchChanged(newValue: string) {
    const searchDebounced = (timeout=500) => {
      clearTimeout(this.searchTimer);
      this.isLoading = true;
      this.searchTimer = setTimeout(() => { 
        this.$store.direct.dispatch.rankings.search({
          searchText: newValue.toLowerCase(),
          gameMode: this.selectedGameModeForSearch,
        });
      }, timeout);
    }

    if (newValue && newValue.length > 2) {
      searchDebounced();
    } else {
      this.$store.direct.dispatch.rankings.clearSearch();
      this.onSearchModelChanged(undefined);
      this.isLoading = false;
    }
  }

  get gameModes() {
    return [
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_1ON1]}`),
        modeId: EGameMode.GM_1ON1,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_2ON2]}`),
        modeId: EGameMode.GM_2ON2,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_2ON2_AT]}`),
        modeId: EGameMode.GM_2ON2_AT,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_4ON4]}`),
        modeId: EGameMode.GM_4ON4,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_FFA]}`),
        gameMode: EGameMode.GM_FFA,
      },
      {
        modeName: this.$t(
          `gameModes.${EGameMode[EGameMode.GM_LEGION_1v1_x20]}`
        ),
        modeId: EGameMode.GM_LEGION_1v1_x20,
      },
      {
        modeName: this.$t(
          `gameModes.${EGameMode[EGameMode.GM_LEGION_2v2_X20]}`
        ),
        modeId: EGameMode.GM_LEGION_2v2_X20,
      },
      {
        modeName: this.$t(
          `gameModes.${EGameMode[EGameMode.GM_LEGION_4v4_X20]}`
        ),
        modeId: EGameMode.GM_LEGION_4v4_X20,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_ROC_1ON1]}`),
        modeId: EGameMode.GM_ROC_1ON1,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_ATR_1ON1]}`),
        modeId: EGameMode.GM_ATR_1ON1,
      },
      {
        modeName: this.$t(
          `gameModes.${EGameMode[EGameMode.GM_BANJOBALL_4ON4]}`
        ),
        modeId: EGameMode.GM_BANJOBALL_4ON4,
      },
    ];
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

  get noDataText(): string {
    if (!this.search || this.search.length < 3) {
      return "Type at least 3 letters";
    }

    return "No player found";
  }

  get totalMatches(): number {
    return this.$store.direct.state.player.totalMatches;
  }

  get matches(): Match[] {
    return this.$store.direct.state.player.matches;
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
    return this.$store.direct.state.rankings.searchRanks;
  }

  public isDuplicateName(name: string) {
    return this.searchRanks.filter((r) => r.player.name === name).length > 1;
  }

  public setSelectedGameModeForSearch(gameMode: EGameMode) {
    this.$store.direct.commit.player.SET_GAMEMODE(gameMode);
    this.getMatches();
  }

  public setPlayerRaceForSearch(race: ERaceEnum) {
    this.$store.direct.commit.player.SET_PLAYER_RACE(race);
    this.getMatches();
  }

  public setOpponentRaceForSearch(race: ERaceEnum) {
    this.$store.direct.commit.player.SET_OPPONENT_RACE(race);
    this.getMatches();
  }

  get totalMatchesAgainstOpponent() {
    const opponentTag = this.$store.direct.state.player.opponentTag;
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
              player.battleTag === this.$store.direct.state.player.opponentTag
          );
        });

        return playerTeamMatch && opponentIsOnTheOtherTeam;
      })
    ).length;

    return totalMatchesAgainstOpponent;
  }

  get opponentWins(): number {
    if (this.$store.direct.state.player.opponentTag.length) {
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
                player.battleTag === this.$store.direct.state.player.opponentTag
            );
          });

          return playerHasWin && opponentIsOnTheOtherTeam;
        })
      ).length;
    }

    return 0;
  }

  public async getMatches(page?: number) {
    if (
      this.isLoadingMatches ||
      !this.$store.direct.state.player.selectedSeason.id
    ) {
      return;
    }

    this.isLoadingMatches = true;

    await this.$store.direct.dispatch.player.loadMatches(page);

    this.isLoadingMatches = false;
  }

  onPageChanged(page: number) {
    this.getMatches(page);
  }

  public selectedGameModeForSearch = EGameMode.UNDEFINED;
}
</script>
