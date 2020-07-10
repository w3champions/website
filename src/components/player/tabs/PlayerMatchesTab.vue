<template>
  <div>
    <v-card-title>
      <v-row align="center">
        <v-col cols="12" md="5">Match History</v-col>
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
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    Wins: {{ data.item.player.wins }} | Losses:
                    {{ data.item.player.losses }} | Total:
                    {{ data.item.player.games }}
                  </v-list-item-subtitle>
                </v-list-item-content>
              </template>
            </template>
          </v-autocomplete>
        </v-col>
        <v-col cols="12" md="2" class="pb-0">
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
      :totalMatches="totalMatches"
      @pageChanged="onPageChanged"
      :itemsPerPage="50"
      :alwaysLeftName="battleTag"
      :only-show-enemy="true"
    ></matches-grid>
  </div>
</template>

<script lang="ts">
  import Vue from "vue";
  import { Component, Prop, Watch } from "vue-property-decorator";
  import MatchesGrid from "@/components/matches/MatchesGrid.vue";
  import { Ranking } from "@/store/ranking/types";
  import { EGameMode, Match, PlayerInTeam, Team } from "@/store/typings";

  @Component({ components: { MatchesGrid } })
export default class PlayerMatchesTab extends Vue {
  @Prop() public battleTag!: string;
  public opponentWins = 0;
  public searchModel = {} as Ranking;
  public search = "";
  public isLoadingMatches = false;
  public isLoading = false;

  @Watch("searchModel")
  public onSearchModelChanged(newVal: Ranking) {
    if (newVal) {
      this.$store.direct.commit.player.SET_OPPONENT_TAG(
        `${newVal.player.playerIds[0].battleTag}`
      );
    } else {
      this.$store.direct.commit.player.SET_OPPONENT_TAG("");
    }
    this.getMatches();
  }

  async mounted() {
    await this.getMatches();
  }

  @Watch("search")
  public onSearchChanged(newValue: string) {
    if (newValue && newValue.length > 2) {
      this.$store.direct.dispatch.rankings.search({
        searchText: newValue.toLowerCase(),
        gameMode: this.selectedGameModeForSearch,
      });
    } else {
      this.$store.direct.dispatch.rankings.clearSearch();
      this.onSearchModelChanged(null as any);
    }
  }

  get gameModes() {
    return [
      {
        modeName: "All",
        modeId: EGameMode.UNDEFINED,
      },
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
        modeId: EGameMode.GM_FFA,
      },
    ];
  }

  get noDataText(): string {
    if (!this.search || this.search.length < 3) {
      return "Type at lease 3 letters";
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

  get searchRanks(): Ranking[] {
    return this.$store.direct.state.rankings.searchRanks;
  }

  public isDuplicateName(name: string) {
    return this.searchRanks.filter((r) => r.player.name === name).length > 1;
  }

  public setSelectedGameModeForSearch(gameMode: EGameMode) {
    this.selectedGameModeForSearch = gameMode;
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

  public async getMatches(page?: number) {
    if (this.isLoadingMatches) {
      return;
    }

    this.isLoadingMatches = true;

    await this.$store.direct.dispatch.player.loadMatches({
      page: page,
      gameMode: this.selectedGameModeForSearch,
    });
    this.opponentWins = 0;
    if (this.$store.direct.state.player.opponentTag.length) {
      this.opponentWins = this.matches.filter((match: Match) =>
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

    this.isLoadingMatches = false;
  }

  onPageChanged(page: number) {
    this.getMatches(page);
  }

  public selectedGameModeForSearch = EGameMode.UNDEFINED;
}
</script>
