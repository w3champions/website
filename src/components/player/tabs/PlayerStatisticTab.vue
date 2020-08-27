<template>
  <div>
    <v-card-title>Statistics</v-card-title>
    <v-row v-if="selectedSeason.id === 0">
      <v-col>
        <v-card-text class="text-center">
          This noble person was part of our beta, therefore we hide his buggy
          stats and thank him for all eternity ;)
        </v-card-text>
      </v-col>
    </v-row>
    <v-row v-if="selectedSeason.id !== 0">
      <v-col cols="md-3">
        <v-card-text>
          <v-select
            :items="patches"
            item-text="patchVersion"
            item-value="patch"
            v-model="selectedPatch"
            @change="setSelectedPatch"
            label="Select Patch"
            outlined
          />
        </v-card-text>
      </v-col>
      <v-col cols="md-9">
        <player-stats-race-versus-race-on-map
          v-if="selectedSeason.id !== 0"
          :stats="raceWithoutRandom"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import MatchesGrid from "@/components/matches/MatchesGrid.vue";
import {
  ERaceEnum,
} from "@/store/typings";
import {
  PlayerStatsRaceOnMapVersusRace,
  RaceWinsOnMap,
} from "@/store/player/types";
import PlayerStatsRaceVersusRaceOnMap from "@/components/player/PlayerStatsRaceVersusRaceOnMap.vue";

@Component({ components: { PlayerStatsRaceVersusRaceOnMap, MatchesGrid } })
export default class PlayerStatisticTab extends Vue {
  public selectedPatch = "All";

  get selectedSeason() {
    return this.$store.direct.state.player.selectedSeason;
  }

  get playerStatsRaceVersusRaceOnMap(): PlayerStatsRaceOnMapVersusRace {
    return this.$store.direct.state.player.playerStatsRaceVersusRaceOnMap;
  }

  get patches() {
    if (
      !this.playerStatsRaceVersusRaceOnMap ||
      !this.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch
    ) {
      return [];
    }
    let patches = ["All"];

    Object.keys(
      this.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch
    ).map((p) => patches.push(p));

    return patches;
  }

  public setSelectedPatch(patch: string) {
    this.selectedPatch = patch;
  }

  get raceWithoutRandom(): RaceWinsOnMap[] {
    if (
      !this.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch ||
      !(
        this.selectedPatch in
        this.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch
      )
    ) {
      return [];
    }

    return this.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch[
      this.selectedPatch
    ].filter((r: any) => r.race !== ERaceEnum.RANDOM);
  }
}
</script>
