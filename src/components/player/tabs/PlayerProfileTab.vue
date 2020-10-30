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
          <v-row v-if="!isBetaSeason">
            <v-col
              cols="12"
              md="4"
              v-for="gameModeStat in topGameModeStats"
              :key="gameModeStat.gameMode"
            >
              <player-league :modeStat="gameModeStat"></player-league>
            </v-col>
          </v-row>
          <v-row v-if="isBetaSeason">
            <v-col>
              <v-card-text>
                This noble person was part of our beta, therefore we hide their
                buggy stats and thank them for all eternity ;)
              </v-card-text>
            </v-col>
          </v-row>
          <v-row class="filter-none" v-if="!isBetaSeason">
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
import * as _ from "lodash";
import PlayerLeague from "@/components/player/PlayerLeague.vue";
import PlayerAvatar from "@/components/player/PlayerAvatar.vue";
import ModeStatsGrid from "@/components/player/ModeStatsGrid.vue";
import RaceIcon from "@/components/player/RaceIcon.vue";
import { EGameMode } from "@/store/typings";

@Component({
  components: { RaceIcon, ModeStatsGrid, PlayerAvatar, PlayerLeague },
})
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

  get isBetaSeason() {
    return this.selectedSeason?.id === 0;
  }

  get battleTag() {
    return decodeURIComponent(this.id);
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
        r.season === this.selectedSeason?.id
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

    const oneVOnes = this.gameModeStats.filter(
      (g) => g.gameMode === EGameMode.GM_1ON1
    );

    const rankedOneVOnes = oneVOnes.filter((x) => x.rank != 0);

    let bestOneVOne = _.sortBy(rankedOneVOnes, [
      "leagueOrder",
      "division",
      "rank",
    ])[0];

    if (!bestOneVOne) {
      bestOneVOne = oneVOnes[0];
    }

    const twoV2s = this.gameModeStats.filter(
      (g) => g.gameMode === EGameMode.GM_2ON2_AT
    );

    const rankedtwoV2s = twoV2s.filter((x) => x.rank != 0);

    let besttwoV2s = _.sortBy(rankedtwoV2s, [
      "leagueOrder",
      "division",
      "rank",
    ])[0];

    if (!besttwoV2s) {
      besttwoV2s = twoV2s[0];
    }

    const otherModes = this.gameModeStats.filter(
      (g) =>
        g.gameMode !== EGameMode.GM_1ON1 && g.gameMode !== EGameMode.GM_2ON2_AT
    );

    const otherModesRanked = otherModes.filter((g) => g.rank != 0);
    const bestOtherModes = _.sortBy(otherModesRanked, [
      "leagueOrder",
      "division",
      "rank",
    ]);

    const allModes = [];
    if (bestOneVOne) allModes.push(bestOneVOne);
    if (besttwoV2s) allModes.push(besttwoV2s);
    allModes.push(...bestOtherModes);

    const bestAllModesSorted = _.sortBy(allModes, [
      "leagueOrder",
      "division",
      "rank",
    ]);

    return _.take(
      bestAllModesSorted.filter((x) => x.rank != 0),
      3
    );
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
