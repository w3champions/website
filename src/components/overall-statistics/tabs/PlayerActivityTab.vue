<template>
  <div>
    <v-card-title>Games per Day</v-card-title>
    <v-card-text v-if="!loadingGamesPerDayStats">
      <v-row>
        <v-col cols="12" md="2">
          <v-card-text>
            <v-select
              v-model="selectedGamesPerDayMode"
              :items="activeGameModesWithAll"
              item-text="name"
              item-value="id"
              @change="setSelectedGamesPerDayMode"
              :label="
                $t(
                  `components_overall-statistics_tabs_playeractivitytab.selectmode`
                )
              "
              outlined
            />
          </v-card-text>
          <div v-if="displayDetailedModeDescription">
            {{
              $t(
                "components_overall-statistics_tabs_playeractivitytab.gamemodedesc1"
              )
            }}
            <br />
            {{
              $t(
                "components_overall-statistics_tabs_playeractivitytab.gamemodedesc2"
              )
            }}
          </div>
        </v-col>
        <v-col cols="12" md="10">
          <activity-per-day-chart
            style="position: relative"
            :selectedGameMode="selectedGamesPerDayMode"
            :game-days="gameDays"
          />
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-title>
      {{
        $t("components_overall-statistics_tabs_playeractivitytab.playersperday")
      }}
    </v-card-title>

    <v-card-text v-if="!loadingPlayersPerDayStats">
      <amount-per-day-chart
        style="position: relative"
        :game-days="playersPerDay"
      />
    </v-card-text>

    <v-card-title>
      {{
        $t("components_overall-statistics_tabs_playeractivitytab.playedmaps")
      }}
    </v-card-title>
    <v-row>
      <v-col cols="12" md="2">
        <v-card-text>
          <v-select
            v-model="selectedModeForMaps"
            :items="activeGameModes"
            item-text="name"
            item-value="id"
            @change="setSelectedModeForMaps"
            :label="
              $t(
                `components_overall-statistics_tabs_playeractivitytab.selectmode`
              )
            "
            outlined
          />
          <v-select
            v-model="selectedSeasonForMaps"
            :items="seasons"
            item-text="id"
            item-value="id"
            @change="setSelectedSeasonForMaps"
            :label="
              $t(
                `components_overall-statistics_tabs_playeractivitytab.selectseason`
              )
            "
            outlined
          />
        </v-card-text>
      </v-col>
      <v-col cols="12" md="10">
        <v-card-text>
          <maps-per-season-chart
            style="position: relative"
            :maps-per-season="mapsPerSeason"
          />
        </v-card-text>
      </v-col>
    </v-row>

    <v-card-title>
      {{
        $t(`components_overall-statistics_tabs_playeractivitytab.popularhours`)
      }}
    </v-card-title>
    <v-row>
      <v-col cols="12" md="2">
        <v-card-text>
          <v-select
            v-model="selectedPopularHourMode"
            :items="activeGameModes"
            item-text="name"
            item-value="id"
            @change="setSelectedPopularHourMode"
            :label="
              $t(
                `components_overall-statistics_tabs_playeractivitytab.selectmode`
              )
            "
            outlined
          />
        </v-card-text>
        <div style="padding: 15px; font-size: 14px">
          Graph adjusted to your timezone
        </div>
      </v-col>
      <v-col cols="12" md="10">
        <v-card-text>
          <popular-game-time-chart :popular-game-hours="selectedGameHours" />
        </v-card-text>
      </v-col>
    </v-row>

    <v-card-title>
      {{
        $t(`components_overall-statistics_tabs_playeractivitytab.gamelengths`)
      }}
    </v-card-title>
    <v-row>
      <v-col cols="12" md="2">
        <v-card-text>
          <v-select
            v-model="selectedLengthMode"
            :items="activeGameModes"
            item-text="name"
            item-value="id"
            @change="setSelectedLengthMode"
            :label="
              $t(
                `components_overall-statistics_tabs_playeractivitytab.selectmode`
              )
            "
            outlined
          />
        </v-card-text>
      </v-col>
      <v-col cols="12" md="10">
        <v-card-text>
          <game-length-chart :game-length="selectedGameLength" />
        </v-card-text>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import {
  GameDay,
  GameDayPerMode,
  GameLength,
  MapCount,
  PopularHours,
} from "@/store/overallStats/types";
import { Component, Mixins } from "vue-property-decorator";
import GameModesMixin from "@/mixins/GameModesMixin";
import GameLengthChart from "@/components/overall-statistics/GameLengthChart.vue";
import AmountPerDayChart from "@/components/overall-statistics/AmountPerDayChart.vue";
import PopularGameTimeChart from "@/components/overall-statistics/PopularGameTimeChart.vue";
import { EGameMode } from "@/store/types";
import ActivityPerDayChart from "@/components/overall-statistics/ActivityPerDayChart.vue";
import MapsPerSeasonChart from "@/components/overall-statistics/MapsPerSeasonChart.vue";
import { useOverallStatsStore } from "@/store/overallStats/store";

@Component({
  components: {
    MapsPerSeasonChart,
    ActivityPerDayChart,
    GameLengthChart,
    AmountPerDayChart,
    PopularGameTimeChart,
  },
})
export default class PlayerActivityTab extends Mixins(GameModesMixin) {
  public selectedLengthMode = EGameMode.GM_1ON1;
  public selectedPopularHourMode = EGameMode.GM_1ON1;
  public selectedGamesPerDayMode = EGameMode.UNDEFINED;
  public selectedSeasonForMaps = "All";
  public overWrittenOnce = false;
  public selectedModeForMaps = EGameMode.GM_1ON1;
  private overallStatsStore = useOverallStatsStore();

  async mounted(): Promise<void> {
    await this.loadActiveGameModes();
    await this.rankingsStore.retrieveSeasons();
  }

  public setSelectedLengthMode(mode: EGameMode) {
    this.selectedLengthMode = mode;
  }

  public setSelectedModeForMaps(mode: EGameMode) {
    this.selectedModeForMaps = mode;
  }

  public setSelectedSeasonForMaps(season: string) {
    this.selectedSeasonForMaps = season;
  }

  public setSelectedGamesPerDayMode(mode: EGameMode) {
    this.selectedGamesPerDayMode = mode;
  }

  public setSelectedPopularHourMode(mode: EGameMode) {
    this.selectedPopularHourMode = mode;
  }

  get seasons() {
    return [
      "All",
      ...this.rankingsStore.seasons.map((s) => s.id.toString()),
    ];
  }

  get selectedGameLength(): GameLength {
    return (
      this.gameLength?.filter(
        (g) => g.gameMode == this.selectedLengthMode
      )[0] ?? { lengths: [] }
    );
  }

  get selectedSeasonForMapsInitial() {
    return this.rankingsStore.seasons[0]?.id?.toString() ?? "";
  }

  get displayDetailedModeDescription() {
    // Only display the extra description (e.g. 2v2 mode is counted twice)
    // for game modes which are included in the description.
    const applicableModes = [
      EGameMode.UNDEFINED,  // "All"
      EGameMode.GM_2ON2,
      EGameMode.GM_4ON4,
      EGameMode.GM_FFA,
      EGameMode.GM_LEGION_4v4_X20,
      EGameMode.GM_LTW_FFA,
      EGameMode.GM_SC_FFA_4,
    ];
    return applicableModes.includes(this.selectedGamesPerDayMode);
  }

  get selectedGameHours(): PopularHours {
    return this.popularGameHours.filter(
      (g) => g.gameMode == this.selectedPopularHourMode
    )[0];
  }

  get loadingGamesPerDayStats(): boolean {
    return this.overallStatsStore.loadingGamesPerDayStats;
  }

  get mapsPerSeason(): MapCount[] {
    if (this.selectedSeasonForMapsInitial && !this.overWrittenOnce) {
      this.selectedSeasonForMaps = this.selectedSeasonForMapsInitial;
      this.overWrittenOnce = true;
    }

    const selectedSeasonMaps =
      this.overallStatsStore.matchesOnMapPerSeason.filter(
        (m) =>
          m.season ===
          (this.selectedSeasonForMaps === "All"
            ? -1
            : parseInt(this.selectedSeasonForMaps))
      )[0];
    if (!selectedSeasonMaps) return [];
    return (
      selectedSeasonMaps?.matchesOnMapPerModes?.filter(
        (m) => m.gameMode === this.selectedModeForMaps
      )[0]?.maps ?? []
    );
  }

  get loadingPlayersPerDayStats(): boolean {
    return this.overallStatsStore.loadingPlayersPerDayStats;
  }

  get gameDays(): GameDayPerMode[] {
    return this.overallStatsStore.gamesPerDay[0];
  }

  get gameDaysForGateways(): GameDayPerMode[][] {
    const all = this.overallStatsStore.gamesPerDay[0];
    const us = this.overallStatsStore.gamesPerDay[1];
    const eu = this.overallStatsStore.gamesPerDay[2];
    const filterForCurrentMode = (all: GameDayPerMode[]) => {
      return all.filter((g) => g.gameMode === this.selectedGamesPerDayMode);
    };

    const gameDayPerModes = filterForCurrentMode(all);
    const gameDayPerModes1 = filterForCurrentMode(eu);
    const gameDayPerModes2 = filterForCurrentMode(us);
    return [gameDayPerModes, gameDayPerModes1, gameDayPerModes2];
  }

  get playersPerDay(): GameDay[] {
    return (
      this.overallStatsStore.playersPerDay
        .reverse()
        ?.splice(
          0,
          this.overallStatsStore.playersPerDay.length - 1
        ) ?? []
    );
  }

  get gameLength(): GameLength[] {
    return this.overallStatsStore.gameLengths;
  }

  get popularGameHours(): PopularHours[] {
    return this.overallStatsStore.popularHours;
  }
}
</script>
