<template>
  <div>
    <div>
      <v-row v-if="selectedSeason.id === 0">
        <v-card-text class="text-center">
          This noble person was part of our beta, therefore we hide his buggy
          stats and thank him for all eternity ;)
        </v-card-text>
      </v-row>
    </div>
    <v-card-title>Matchup Statistics</v-card-title>
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
    <v-card-title>MMR and RP Timeline</v-card-title>

    <v-row v-if="selectedSeason.id !== 0">
      <v-col cols="12" md="2">
        <v-card-text>
          <v-select
            :items="gameModes"
            item-text="modeName"
            item-value="modeId"
            v-model="selectedGameMode"
            @change="setTimelineMode"
            label="Select Mode"
            outlined
          />
          <v-select
            :items="races"
            item-text="raceName"
            item-value="raceId"
            v-model="selectedRace"
            @change="setTimelineRace"
            label="Select Race"
            outlined
          />
        </v-card-text>
      </v-col>
      <v-col cols="12" md="10">
        <v-card-text v-if="!loadingMmrRpTimeline">
          <player-mmr-rp-timeline-chart
            style="position: relative"
            :mmrRpTimeline="playerMmrRpTimeline"
          />
          <v-card-text v-if="isPlayerMmrRpTimelineEmpty">
            This player hasn't played any matches fitting to the current
            settings.
          </v-card-text>
        </v-card-text>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import MatchesGrid from "@/components/matches/MatchesGrid.vue";
import { EGameMode, ERaceEnum } from "@/store/typings";
import {
  PlayerMmrRpTimeline,
  PlayerStatsRaceOnMapVersusRace,
  RaceStat,
  RaceWinsOnMap,
} from "@/store/player/types";
import PlayerStatsRaceVersusRaceOnMap from "@/components/player/PlayerStatsRaceVersusRaceOnMap.vue";
import PlayerMmrRpTimelineChart from "@/components/player/PlayerMmrRpTimelineChart.vue";

@Component({
  components: {
    PlayerStatsRaceVersusRaceOnMap,
    PlayerMmrRpTimelineChart,
    MatchesGrid,
  },
})
export default class PlayerStatisticTab extends Vue {
  public selectedPatch = "All";
  public selectedGameMode = this.$store.direct.state.player.gameMode;
  public selectedRace = this.$store.direct.state.player.race;

  get selectedSeason() {
    return this.$store.direct.state.player.selectedSeason;
  }

  get playerStatsRaceVersusRaceOnMap(): PlayerStatsRaceOnMapVersusRace {
    return this.$store.direct.state.player.playerStatsRaceVersusRaceOnMap;
  }

  get loadingMmrRpTimeline(): boolean {
    return this.$store.direct.state.player.loadingMmrRpTimeline;
  }

  get playerMmrRpTimeline(): PlayerMmrRpTimeline | undefined {
    return this.$store.direct.state.player.mmrRpTimeline;
  }

  get isPlayerMmrRpTimelineEmpty(): boolean {
    return this.$store.direct.state.player.mmrRpTimeline == undefined;
  }

  get isPlayerInitialized(): boolean {
    return this.$store.direct.state.player.isInitialized;
  }

  mounted(): void {
    if (this.isPlayerInitialized) {
      this.initMmrRpTimeline();
    }
  }
  // When loading the statistics tab via URL directly, due to Lifecycle Hooks the mounted() here
  // is called before mounted of player, which this depends on. For this case isPlayerInitialized
  // is being watched to init the mmrRpTimeline once player.vue init() has finished.
  @Watch("isPlayerInitialized")
  onPlayerInitialized(): void {
    this.initMmrRpTimeline();
  }

  private async initMmrRpTimeline() {
    let raceStats = this.$store.direct.state.player.raceStats;
    let maxRace = ERaceEnum.HUMAN;
    let maxWins = 0;
    raceStats.forEach((r) => {
      if (r.wins > maxWins) {
        maxWins = r.wins;
        maxRace = r.race;
      }
    });
    await this.$store.direct.commit.player.SET_GAMEMODE(EGameMode.GM_1ON1);
    await this.$store.direct.commit.player.SET_RACE(maxRace);
    this.selectedGameMode = EGameMode.GM_1ON1;
    this.selectedRace = maxRace;

    this.$store.direct.dispatch.player.loadPlayerMmrRpTimeline();
  }

  private async setTimelineMode(mode: EGameMode) {
    this.$store.direct.commit.player.SET_GAMEMODE(mode);
    this.$store.direct.dispatch.player.loadPlayerMmrRpTimeline();
  }
  private async setTimelineRace(race: ERaceEnum) {
    this.$store.direct.commit.player.SET_RACE(race);
    this.$store.direct.dispatch.player.loadPlayerMmrRpTimeline();
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
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_4ON4]}`),
        modeId: EGameMode.GM_4ON4,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_FFA]}`),
        modeId: EGameMode.GM_FFA,
      },
    ];
  }
  get races() {
    return [
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
}
</script>
