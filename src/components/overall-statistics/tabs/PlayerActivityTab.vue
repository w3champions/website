<template>
  <div>
    <v-card-title>Games per Day</v-card-title>
    <v-card-text v-if="!loadingGamesPerDayStats">
      <v-row>
        <v-col cols="12" md="2">
          <v-card-text>
            <v-select
              v-model="selectedGamesPerDayMode"
              :items="activeGameModesWithAll()"
              item-text="name"
              item-value="id"
              @change="setSelectedGamesPerDayMode"
              :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectmode`)"
              outlined
            />
          </v-card-text>
          <div v-if="isAllMode">
            {{ $t("components_overall-statistics_tabs_playeractivitytab.gamemodedesc1") }}
            <br />
            {{ $t("components_overall-statistics_tabs_playeractivitytab.gamemodedesc2") }}
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
      {{ $t("components_overall-statistics_tabs_playeractivitytab.playersperday") }}
    </v-card-title>

    <v-card-text v-if="!loadingPlayersPerDayStats">
      <amount-per-day-chart
        style="position: relative"
        :game-days="playersPerDay"
      />
    </v-card-text>

    <v-card-title>
      {{ $t("components_overall-statistics_tabs_playeractivitytab.playedmaps") }}
    </v-card-title>
    <v-row>
      <v-col cols="12" md="2">
        <v-card-text>
          <v-select
            v-model="selectedModeForMaps"
            :items="activeGameModes()"
            item-text="name"
            item-value="id"
            @change="setSelectedModeForMaps"
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectmode`)"
            outlined
          />
          <v-select
            v-model="selectedSeasonForMaps"
            :items="seasons"
            item-text="id"
            item-value="id"
            @change="setSelectedSeasonForMaps"
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectseason`)"
            outlined
          />
        </v-card-text>
      </v-col>
      <v-col cols="12" md="10">
        <v-card-text>
          <maps-per-season-chart
            style="position: relative"
            :maps-per-season="mapsPerSeason()"
          />
        </v-card-text>
      </v-col>
    </v-row>

    <v-card-title>
      {{ $t(`components_overall-statistics_tabs_playeractivitytab.popularhours`) }}
    </v-card-title>
    <v-row>
      <v-col cols="12" md="2">
        <v-card-text>
          <v-select
            v-model="selectedPopularHourMode"
            :items="activeGameModes()"
            item-text="name"
            item-value="id"
            @change="setSelectedPopularHourMode"
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectmode`)"
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
      {{ $t(`components_overall-statistics_tabs_playeractivitytab.gamelengths`) }}
    </v-card-title>
    <v-row>
      <v-col cols="12" md="2">
        <v-card-text>
          <v-select
            v-model="selectedLengthMode"
            :items="activeGameModes()"
            item-text="name"
            item-value="id"
            @change="setSelectedLengthMode"
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectmode`)"
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
      {{ $t(`components_overall-statistics_tabs_playeractivitytab.matchuplengths`) }}
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
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectrace`)"
            outlined
          />
          <v-select
            v-model="selectedMatchupRace2"
            :items="raceOptions"
            item-text="name"
            item-value="id"
            @change="setSelectedMatchupRace2"
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectrace`)"
            outlined
          />
          <v-select
            v-model="selectedMatchupMmr"
            :items="matchupMmrOptions"
            item-text="name"
            item-value="id"
            @change="setSelectedMatchupMmr"
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectmmr`)"
            outlined
          />
          <v-select
            v-model="selectedMatchupSeason"
            :items="seasonsForMatchup"
            item-text="name"
            item-value="id"
            @change="setMatchupLengthSeason"
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectseason`)"
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
import { computed, ComputedRef, defineComponent, onMounted, ref } from "vue";
import { GameDay, GameDayPerMode, GameLength, MapCount, MmrRangeValues, PopularHours } from "@/store/overallStats/types";
import { activeGameModes, activeGameModesWithAll, loadActiveGameModes } from "@/mixins/GameModesMixin";
import GameLengthChart from "@/components/overall-statistics/GameLengthChart.vue";
import MatchupLengthBarChart from "@/components/overall-statistics/MatchupLengthBarChart.vue";
import AmountPerDayChart from "@/components/overall-statistics/AmountPerDayChart.vue";
import PopularGameTimeChart from "@/components/overall-statistics/PopularGameTimeChart.vue";
import { EGameMode, ERaceEnum } from "@/store/types";
import ActivityPerDayChart from "@/components/overall-statistics/ActivityPerDayChart.vue";
import MapsPerSeasonChart from "@/components/overall-statistics/MapsPerSeasonChart.vue";
import { useOverallStatsStore } from "@/store/overallStats/store";
import { useRankingStore } from "@/store/ranking/store";

export default defineComponent({
  name: "PlayerActivityTab",
  components: {
    MapsPerSeasonChart,
    ActivityPerDayChart,
    GameLengthChart,
    MatchupLengthBarChart,
    AmountPerDayChart,
    PopularGameTimeChart,
  },
  props: {},
  setup() {
    const overallStatsStore = useOverallStatsStore();
    const rankingsStore = useRankingStore();
    const selectedLengthMode = ref<number>(EGameMode.GM_1ON1);
    const selectedModeForMaps = ref<number>(EGameMode.GM_1ON1);
    const selectedSeasonForMaps = ref<string>("All");
    const selectedGamesPerDayMode = ref<EGameMode>(EGameMode.UNDEFINED);
    const selectedPopularHourMode = ref<EGameMode>(EGameMode.GM_1ON1);
    const selectedMatchupRace1 = ref<ERaceEnum>(ERaceEnum.HUMAN);
    const selectedMatchupRace2 = ref<ERaceEnum>(ERaceEnum.HUMAN);
    const selectedMatchupMmr = ref<string>("all");
    const selectedMatchupSeason = ref<string>("all");
    const selectedSeasonForMapsInitial: ComputedRef<string> = computed((): string => rankingsStore.seasons[0]?.id?.toString() ?? "");
    const isAllMode: ComputedRef<boolean> = computed((): boolean => selectedGamesPerDayMode.value === EGameMode.UNDEFINED);
    const race1String: ComputedRef<string> = computed((): string => raceOptions.filter((r) => r.id == selectedMatchupRace1.value)[0].name);
    const race2String: ComputedRef<string> = computed((): string => raceOptions.filter((r) => r.id == selectedMatchupRace2.value)[0].name);
    let overWrittenOnce = false;

     onMounted(async (): Promise<void> => {
      await loadActiveGameModes();
      await rankingsStore.retrieveSeasons();
      setMatchupLengthSeason("all");
     });

    function setSelectedLengthMode(mode: EGameMode) {
      selectedLengthMode.value = mode;
    }

    function setSelectedModeForMaps(mode: EGameMode) {
      selectedModeForMaps.value = mode;
    }

    function setSelectedSeasonForMaps(season: string) {
      selectedSeasonForMaps.value = season;
    }

    function setSelectedGamesPerDayMode(mode: EGameMode) {
      selectedGamesPerDayMode.value = mode;
    }

    function setSelectedPopularHourMode(mode: EGameMode) {
      selectedPopularHourMode.value = mode;
    }

    function setSelectedMatchupRace1(race: ERaceEnum) {
      selectedMatchupRace1.value = race;
      overallStatsStore.loadMatchupLengthStatistics(selectedMatchupRace1.value, selectedMatchupRace2.value, selectedMatchupSeason.value);
    }

    function setSelectedMatchupRace2(race: ERaceEnum) {
      selectedMatchupRace2.value = race;
      overallStatsStore.loadMatchupLengthStatistics(selectedMatchupRace1.value, selectedMatchupRace2.value, selectedMatchupSeason.value);
    }

    function setSelectedMatchupMmr(mmr: string) {
      overallStatsStore.SET_MATCHUP_MMR_RANGE(mmr as MmrRangeValues);
      selectedMatchupMmr.value = mmr;
    }

    function setMatchupLengthSeason(season: string) {
      selectedMatchupSeason.value = season.toLocaleLowerCase();
      overallStatsStore.loadMatchupLengthStatistics(selectedMatchupRace1.value, selectedMatchupRace2.value, selectedMatchupSeason.value);
    }

    const seasons: ComputedRef<string[]> = computed((): string[] => ["All", ...rankingsStore.seasons.map((s) => s.id.toString())]);

    const seasonsForMatchup: ComputedRef<{ id: string; name: string }[]> = computed((): { id: string; name: string }[] => {
      return seasons.value.map((e) => { return { id: e.toLowerCase(), name: e }; });
    });

    const raceOptions = [
      { name: "Human", id: ERaceEnum.HUMAN },
      { name: "Orc", id: ERaceEnum.ORC },
      { name: "Night Elf", id: ERaceEnum.NIGHT_ELF },
      { name: "Undead", id: ERaceEnum.UNDEAD },
    ];

    const matchupMmrOptions: ComputedRef<{ id: string; name: string }[]> = computed((): { id: string; name: string }[] => {
      const mmrOptions = ["all"];
      for (let i = 400; i < 3000; i += 200) {
        mmrOptions.push(i.toString());
      }
      return mmrOptions.map((mmr) => {
        return {
          id: mmr,
          name: mmr == "all" ? "All" : `${mmr}-${parseInt(mmr) + 200}`
        };
      });
    });

    const selectedGameLength: ComputedRef<GameLength> = computed((): GameLength => {
      return gameLength.value?.filter(
          (g) => g.gameMode == selectedLengthMode.value
        )[0] ?? { lengths: [] };
    });

    const selectedGameHours: ComputedRef<PopularHours> = computed((): PopularHours => {
      return popularGameHours.value.filter(
        (g) => g.gameMode == selectedPopularHourMode.value
      )[0] ?? { timeslots: [] };
    });

    const loadingGamesPerDayStats: ComputedRef<boolean> = computed((): boolean => overallStatsStore.loadingGamesPerDayStats);
    const loadingPlayersPerDayStats: ComputedRef<boolean> = computed((): boolean => overallStatsStore.loadingPlayersPerDayStats);
    const gameDays: ComputedRef<GameDayPerMode[]> = computed((): GameDayPerMode[] => overallStatsStore.gamesPerDay[0]);
    const gameLength: ComputedRef<GameLength[]> = computed((): GameLength[] => overallStatsStore.gameLengths);
    const popularGameHours: ComputedRef<PopularHours[]> = computed((): PopularHours[] => overallStatsStore.popularHours);

    function mapsPerSeason(): MapCount[] {
      if (selectedSeasonForMapsInitial.value && !overWrittenOnce) {
        selectedSeasonForMaps.value = selectedSeasonForMapsInitial.value;
        overWrittenOnce = true;
      }

      const selectedSeasonMaps =
        overallStatsStore.matchesOnMapPerSeason.filter(
          (m) =>
            m.season ===
            (selectedSeasonForMaps.value === "All"
              ? -1
              : parseInt(selectedSeasonForMaps.value))
        )[0];
      if (!selectedSeasonMaps) return [];
      return (
        selectedSeasonMaps?.matchesOnMapPerModes?.filter(
          (m) => m.gameMode === selectedModeForMaps.value
        )[0]?.maps ?? []
      );
    }

    const playersPerDay: ComputedRef<GameDay[]> = computed((): GameDay[] => {
      return (
        overallStatsStore.playersPerDay
          .toReversed()
          ?.splice(
            0,
            overallStatsStore.playersPerDay.length - 1
          ) ?? []
      );
    });

    return {
      loadingGamesPerDayStats,
      loadingPlayersPerDayStats,
      selectedGamesPerDayMode,
      activeGameModesWithAll,
      setSelectedGamesPerDayMode,
      isAllMode,
      gameDays,
      playersPerDay,
      selectedModeForMaps,
      activeGameModes,
      setSelectedModeForMaps,
      selectedSeasonForMaps,
      seasons,
      setSelectedSeasonForMaps,
      mapsPerSeason,
      selectedPopularHourMode,
      setSelectedPopularHourMode,
      selectedGameHours,
      selectedLengthMode,
      setSelectedLengthMode,
      selectedGameLength,
      raceOptions,
      selectedMatchupRace1,
      setSelectedMatchupRace1,
      selectedMatchupRace2,
      setSelectedMatchupRace2,
      matchupMmrOptions,
      selectedMatchupMmr,
      setSelectedMatchupMmr,
      seasonsForMatchup,
      selectedMatchupSeason,
      setMatchupLengthSeason,
      race1String,
      race2String,
    };
  },
});
</script>
