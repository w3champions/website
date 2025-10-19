<template>
  <div>
    <v-card-title>
      {{ $t("components_overall-statistics_tabs_playeractivitytab.gamesperday") }}
    </v-card-title>
    <v-row v-if="!loadingGamesPerDayStats">
      <v-col cols="12" md="2">
        <v-card-text>
          <v-select
            v-model="selectedGamesPerDayMode"
            :items="activeGameModesWithAll()"
            item-title="name"
            item-value="id"
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectmode`)"
            variant="outlined"
            hide-details
            @update:model-value="setSelectedGamesPerDayMode"
          />
          <v-switch
            v-model="normalizedGamesPerDay"
            class="mt-2"
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.normalized`)"
            @update:model-value="setNormalizedGamesPerDay"
          />
          <div v-if="normalizedGamesPerDay">
            {{ $t("components_overall-statistics_tabs_playeractivitytab.gamemodedesc1") }}
            <br />
            {{ $t("components_overall-statistics_tabs_playeractivitytab.gamemodedesc2") }}
          </div>
        </v-card-text>
      </v-col>
      <v-col cols="12" md="10">
        <activity-per-day-chart
          style="position: relative"
          :selectedGameMode="selectedGamesPerDayMode"
          :game-days="gameDays"
          :normalized="normalizedGamesPerDay"
        />
      </v-col>
    </v-row>
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
            item-title="name"
            item-value="id"
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectmode`)"
            variant="outlined"
            @update:model-value="setSelectedModeForMaps"
          />
          <v-select
            v-model="selectedSeasonForMaps"
            :items="seasons"
            item-title="id"
            item-value="id"
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectseason`)"
            variant="outlined"
            @update:model-value="setSelectedSeasonForMaps"
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
            item-title="name"
            item-value="id"
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectmode`)"
            variant="outlined"
            @update:model-value="setSelectedPopularHourMode"
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
            item-title="name"
            item-value="id"
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectmode`)"
            variant="outlined"
            @update:model-value="setSelectedLengthMode"
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
            item-title="name"
            item-value="id"
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectrace`)"
            variant="outlined"
            @update:model-value="setSelectedMatchupRace1"
          />
          <v-select
            v-model="selectedMatchupRace2"
            :items="raceOptions"
            item-title="name"
            item-value="id"
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectrace`)"
            variant="outlined"
            @update:model-value="setSelectedMatchupRace2"
          />
          <v-select
            v-model="selectedMatchupMmr"
            :items="matchupMmrOptions"
            item-title="name"
            item-value="id"
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectmmr`)"
            variant="outlined"
            @update:model-value="setSelectedMatchupMmr"
          />
          <v-select
            v-model="selectedMatchupSeason"
            :items="seasonsForMatchup"
            item-title="name"
            item-value="id"
            :label="$t(`components_overall-statistics_tabs_playeractivitytab.selectseason`)"
            variant="outlined"
            @update:model-value="setMatchupLengthSeason"
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
import { computed, defineComponent, onMounted, ref } from "vue";
import { GameDay, GameDayPerMode, GameLength, MapCount, MmrRangeValues, PopularHours } from "@/store/overallStats/types";
import { activeGameModes, activeGameModesWithAll, loadActiveGameModes } from "@/composables/GameModesMixin";
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
    const normalizedGamesPerDay = ref<boolean>(true);
    const selectedSeasonForMapsInitial = computed<string>(() => rankingsStore.seasons[0]?.id?.toString() ?? "");
    const isAllMode = computed<boolean>(() => selectedGamesPerDayMode.value === EGameMode.UNDEFINED);
    const race1String = computed<string>(() => raceOptions.filter((r) => r.id == selectedMatchupRace1.value)[0].name);
    const race2String = computed<string>(() => raceOptions.filter((r) => r.id == selectedMatchupRace2.value)[0].name);
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

    function setNormalizedGamesPerDay(normalized: boolean) {
      normalizedGamesPerDay.value = normalized;
    }

    const seasons = computed<string[]>(() =>
      ["All", ...rankingsStore.seasons.map((s) => s.id.toString())]
    );

    const seasonsForMatchup = computed<{ id: string; name: string }[]>(() =>
      seasons.value.map((e) => ({ id: e.toLowerCase(), name: e }))
    );

    const raceOptions = [
      { name: "Human", id: ERaceEnum.HUMAN },
      { name: "Orc", id: ERaceEnum.ORC },
      { name: "Night Elf", id: ERaceEnum.NIGHT_ELF },
      { name: "Undead", id: ERaceEnum.UNDEAD },
    ];

    const matchupMmrOptions = computed<{ id: string; name: string }[]>(() => {
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

    const selectedGameLength = computed<GameLength>(() => {
      return gameLength.value?.filter(
        (g) => g.gameMode == selectedLengthMode.value
      )[0] ?? { lengths: [] };
    });

    const selectedGameHours = computed<PopularHours>(() => {
      return popularGameHours.value.filter(
        (g) => g.gameMode == selectedPopularHourMode.value
      )[0] ?? { timeslots: [] };
    });

    const loadingGamesPerDayStats = computed<boolean>(() => overallStatsStore.loadingGamesPerDayStats);
    const loadingPlayersPerDayStats = computed<boolean>(() => overallStatsStore.loadingPlayersPerDayStats);
    const gameDays = computed<GameDayPerMode[]>(() => overallStatsStore.gamesPerDay[0]);
    const gameLength = computed<GameLength[]>(() => overallStatsStore.gameLengths);
    const popularGameHours = computed<PopularHours[]>(() => overallStatsStore.popularHours);

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

    const playersPerDay = computed<GameDay[]>(() => {
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
      normalizedGamesPerDay,
      setNormalizedGamesPerDay,
    };
  },
});
</script>
