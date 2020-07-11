<template>
  <div>
    <v-card-text v-if="!loadingProfile">
      <v-row class="mt-4 filter-none">
        <v-col cols="12" md="4" lg="3">
          <v-card-text style="padding-top: 0 !important;">
            <player-avatar :is-logged-in-player="isLoggedInPlayer" />
          </v-card-text>
        </v-col>
        <v-col md="12" lg="9">
          <v-row>
            <v-col
              cols="12"
              md="4"
              v-for="gameModeStat in topGameModeStats"
              :key="gameModeStat.gameMode"
            >
              <player-league :modeStat="gameModeStat"></player-league>
            </v-col>
          </v-row>
          <v-row class="filter-none" v-if="selectedSeason.id === 0">
            <v-card-text class="text-center">
              This noble person was part of our beta, therefore we hide his
              buggy stats and thank him for all eternity ;)
            </v-card-text>
          </v-row>
          <v-row class="filter-none" v-if="selectedSeason.id !== 0">
            <v-col cols="12" md="4">
              <h4 style="position: relative;">Stats by race</h4>
              <v-data-table
                hide-default-footer
                :headers="raceHeaders"
                :items="selectedRaceStats"
              >
                <template v-slot:item.race="{ item }">
                  <span><race-icon v-bind:race="item.race" /></span>
                </template>
                <template v-slot:item.wins="{ item }">
                  <span class="number-text">
                    <span class="won">{{ item.wins }}</span>
                    -
                    <span class="lost">{{ item.losses }}</span>
                    <span style="float: right;">
                      ({{ (item.winrate * 100).toFixed(1) }}%)
                    </span>
                  </span>
                </template>
              </v-data-table>
            </v-col>
            <v-col cols="12" md="6">
              <h4 style="position: relative;">Stats by game mode</h4>
              <mode-stats-grid :stats="gameModeStats" />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-text
      v-if="loadingProfile"
      style="min-height: 500px;"
      class="text-center"
    >
      <v-progress-circular
        style="margin-top: 180px;"
        :size="50"
        color="primary"
        indeterminate
      ></v-progress-circular>
    </v-card-text>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ModeStat } from "@/store/player/types";
import * as _ from "lodash";
import PlayerLeague from "@/components/player/PlayerLeague.vue";
import PlayerAvatar from "@/components/player/PlayerAvatar.vue";
import ModeStatsGrid from "@/components/player/ModeStatsGrid.vue";
import RaceIcon from "@/components/player/RaceIcon.vue";

@Component({ components: { RaceIcon, ModeStatsGrid, PlayerAvatar, PlayerLeague } })
export default class PlayerProfileTab extends Vue {
  @Prop() public id!: string;

  public raceHeaders = [
    {
      text: "Race",
      align: "start",
      sortable: false,
      value: "race",
    },
    {
      text: "Win/Loss",
      align: "start",
      sortable: false,
      value: "wins",
    },
  ];

  get battleTag() {
    return this.id;
  }

  get loadingProfile(): boolean {
    return this.$store.direct.state.player.loadingProfile;
  }

  get isLoggedInPlayer(): boolean {
    if (this.verifiedBtag === "") return false;
    return this.battleTag.startsWith(this.verifiedBtag);
  }

  get verifiedBtag(): string {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag;
  }

  get gameModeStats() {
    return this.$store.direct.state.player.gameModeStats;
  }

  get selectedRaceStats() {
    if (!this.raceStats) {
      return [];
    }

    return this.raceStats.filter(
      (r) =>
        r.gateWay === this.$store.direct.state.gateway &&
        r.season === this.selectedSeason.id
    );
  }

  get selectedSeason() {
    return this.$store.direct.state.player.selectedSeason;
  }

  get raceStats() {
    return this.$store.direct.state.player.raceStats;
  }

  get topGameModeStats() {
    if (!this.gameModeStats) {
      return [];
    }

    const bestModesMap: { [gameMode: number]: ModeStat } = {};

    this.gameModeStats.forEach((x) => {
      const foundMode = bestModesMap[x.gameMode];

      if (foundMode) {
        // if league is better
        if (foundMode.leagueId > x.leagueId) {
          bestModesMap[x.gameMode] = x;
        }

        // if same league but rank is better
        if (foundMode.leagueId == x.leagueId && foundMode.rank > x.rank) {
          bestModesMap[x.gameMode] = x;
        }
      } else {
        bestModesMap[x.gameMode] = x;
      }
    });

    let result: ModeStat[] = [];
    for (const key in bestModesMap) {
      const gameModeStat = bestModesMap[key];
      result.push(gameModeStat);
    }

    const sortByLeagueFun = (x: ModeStat) => {
      if (x.rank === 0) {
        return 100000; // Push at the end of sorting
      }
      return x.leagueId;
    };

    const sortByRankFun = (x: ModeStat) => {
      if (x.rank === 0) {
        return 100000; // Push at the end of sorting
      }
      return x.rank;
    };

    result = _.orderBy(
      result,
      [sortByLeagueFun, sortByRankFun],
      ["asc", "asc"]
    );

    return _.take(result, 3);
  }
}
</script>

<style lang="scss" scoped>
.countryInput {
  margin-left: -11px;
}

.player-country {
  position: absolute;
  border-color: white;
  border-style: solid;
  border-width: thin;
  bottom: 0px;
  right: -5px;
}

.country__container {
  position: relative;
  max-width: 120px;
}

.socialIcon {
  padding-top: 0px;
  padding-left: 2px;
}

.twitchIcon {
  margin-top: 2px;
}

@media (min-width: 960px) {
  .player-avatar {
    height: 185px !important;
  }

  .country__container {
    max-width: 185px !important;
  }
}

.player-avatar {
  max-width: 185px;
  height: 120px;
  background-repeat: no-repeat;
  background-size: contain;
}

.player-avatar-choosing {
  padding-top: 100%;
  width: 100%;
  background-repeat: no-repeat;
  background-size: contain;
}

.player-avatar-choosing-disabled {
  opacity: 0.5;
  filter: alpha(opacity=50);
}

.player-league {
  width: 182px;

  .player-league-rank {
    font-size: 20px;
  }

  .player-league-points {
    font-size: 13px;
  }
}
</style>
