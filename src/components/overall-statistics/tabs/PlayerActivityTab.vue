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
          <div v-if="isAllMode">
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
    
    <v-card-title>
      {{
        $t(`components_overall-statistics_tabs_playeractivitytab.matchuplengths`)
      }}
    </v-card-title>

    <v-row>
      <v-col cols="12" md="2">
        <v-card-text>
          <v-select
            v-model="selectedMatchupRace1"
            :items="raceOptions"
            item-text="name"
            item-value="id"
            @change="setSelectedMatchupRace1"
            :label="
              $t(
                `components_overall-statistics_tabs_playeractivitytab.selectrace`
              )
            "
            outlined
          />
          <v-select
            v-model="selectedMatchupRace2"
            :items="raceOptions"
            item-text="name"
            item-value="id"
            @change="setSelectedMatchupRace2"
            :label="
              $t(
                `components_overall-statistics_tabs_playeractivitytab.selectrace`
              )
            "
            outlined
          />
          <v-select
            v-model="selectedMatchupMmr"
            :items="matchupMmrOptions"
            item-text="name"
            item-value="id"
            @change="setSelectedMatchupMmr"
            :label="
              $t(
                `components_overall-statistics_tabs_playeractivitytab.selectmmr`
              )
            "
            outlined
          />
          <v-select
            v-model="selectedMatchupSeason"
            :items="seasonsForMatchup"
            item-text="name"
            item-value="id"
            @change="setMatchupLengthSeason"
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
          {{ race1String }} vs {{ race2String }}
          <matchup-length-bar-chart />
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
  Length,
  MapCount,
  MatchupLength,
  MmrRangeValues,
  PopularHours,
} from "@/store/overallStats/types";
import { Component, Mixins } from "vue-property-decorator";
import GameModesMixin from "@/mixins/GameModesMixin";
import GameLengthChart from "@/components/overall-statistics/GameLengthChart.vue";
import MatchupLengthBarChart from "@/components/overall-statistics/MatchupLengthBarChart.vue";
import AmountPerDayChart from "@/components/overall-statistics/AmountPerDayChart.vue";
import PopularGameTimeChart from "@/components/overall-statistics/PopularGameTimeChart.vue";
import { EGameMode, ERaceEnum } from "@/store/types";
import ActivityPerDayChart from "@/components/overall-statistics/ActivityPerDayChart.vue";
import MapsPerSeasonChart from "@/components/overall-statistics/MapsPerSeasonChart.vue";
import { useOverallStatsStore } from "@/store/overallStats/store";

@Component({
  components: {
    MapsPerSeasonChart,
    ActivityPerDayChart,
    GameLengthChart,
    MatchupLengthBarChart,
    AmountPerDayChart,
    PopularGameTimeChart,
  },
})
export default class PlayerActivityTab extends Mixins(GameModesMixin) {
  public selectedLengthMode = EGameMode.GM_1ON1;
  public selectedPopularHourMode = EGameMode.GM_1ON1;
  public selectedGamesPerDayMode = EGameMode.UNDEFINED;
  public selectedSeasonForMaps = "All";
  public selectedMatchupSeason = "all";
  public selectedMatchupRace1 = ERaceEnum.HUMAN;
  public selectedMatchupRace2 = ERaceEnum.HUMAN;
  public selectedMatchupMmr = "all";
  public overWrittenOnce = false;
  public selectedModeForMaps = EGameMode.GM_1ON1;
  private overallStatsStore = useOverallStatsStore();

  async mounted(): Promise<void> {
    await this.loadActiveGameModes();
    await this.rankingsStore.retrieveSeasons();
    this.setMatchupLengthSeason("all");
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

  public setSelectedMatchupRace1(race: ERaceEnum) {
    this.selectedMatchupRace1 = race;
    this.overallStatsStore.loadMatchupLengthStatistics(this.selectedMatchupRace1, this.selectedMatchupRace2, this.selectedMatchupSeason);
  }

  public setSelectedMatchupRace2(race: ERaceEnum) {
    this.selectedMatchupRace2 = race;
    this.overallStatsStore.loadMatchupLengthStatistics(this.selectedMatchupRace1, this.selectedMatchupRace2, this.selectedMatchupSeason);
  }

  public setSelectedMatchupMmr(mmr: string) {
    this.overallStatsStore.SET_MATCHUP_MMR_RANGE(mmr as MmrRangeValues);
    this.selectedMatchupMmr = mmr;
  }

  public setMatchupLengthSeason(season: string) {
    this.selectedMatchupSeason = season.toLocaleLowerCase();
    this.overallStatsStore.loadMatchupLengthStatistics(this.selectedMatchupRace1, this.selectedMatchupRace2, this.selectedMatchupSeason);
  }

  get seasons() {
    return [
      "All",
      ...this.rankingsStore.seasons.map((s) => s.id.toString()),
    ];
  }

  get seasonsForMatchup() {
    return this.seasons.map(e => { return { id: e.toLowerCase(), name: e}; });
  }

  get raceOptions() {
    return [
      {
        name: "Human",
        id: ERaceEnum.HUMAN,
      },
      {
        name: "Orc",
        id: ERaceEnum.ORC,
      },
      {
        name: "Night Elf",
        id: ERaceEnum.NIGHT_ELF,
      },
      {
        name: "Undead",
        id: ERaceEnum.UNDEAD,
      },
    ]
  }

  get race1String(): string {
    return this.raceOptions.filter(r => r.id == this.selectedMatchupRace1)[0].name;
  }

  get race2String(): string {
    return this.raceOptions.filter(r => r.id == this.selectedMatchupRace2)[0].name;
  }

  get matchupMmrOptions() {
    const mmrOptions = ["all"];
    for (let i = 600; i <= 3000; i+=200) {
      mmrOptions.push(i.toString());
    }
    return mmrOptions.map((mmr) => {
      return {
        id: mmr, 
        name: mmr == "all" ? "All": `${mmr}-${parseInt(mmr)+200}`
      }
    });
  }

  get selectedGameLength(): GameLength {
    return (
      this.gameLength?.filter(
        (g) => g.gameMode == this.selectedLengthMode
      )[0] ?? { lengths: [] }
    );
  }

  get selectedMatchupLength(): Length[] {
    const lengths: Length[] = this.matchupLength?.lengthsByMmrRange?.all || [];
    return lengths;
  }

  get selectedSeasonForMapsInitial() {
    return this.rankingsStore.seasons[0]?.id?.toString() ?? "";
  }

  get isAllMode() {
    return this.selectedGamesPerDayMode === EGameMode.UNDEFINED;
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

  get matchupLength(): MatchupLength {
    return this.overallStatsStore.matchupLength;
  }

  get popularGameHours(): PopularHours[] {
    return this.overallStatsStore.popularHours;
  }
}
</script>
