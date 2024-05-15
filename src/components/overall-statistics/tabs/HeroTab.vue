<template>
  <div>
    <v-row>
      <v-col cols="12">
        <hero-winrate />
      </v-col>
    </v-row>
    <v-card-title>
      {{ $t("components_overall-statistics_tabs_herotab.pickedheroes") }}
    </v-card-title>
    <v-row>
      <v-col cols="12" md="2">
        <v-card-text>
          <v-select
            v-model="selectedHeroesPlayedMode"
            :items="gameModes"
            item-text="name"
            item-value="id"
            @change="setSelectedHeroesPlayedMode"
            :label="$t(`components_overall-statistics_tabs_herotab.mode`)"
            outlined
          />
          <v-select
            v-model="selectedHeroesPlayedPick"
            :items="picks"
            item-text="pickName"
            item-value="pickId"
            @change="setSelectedHeroesPlayedPick"
            :label="$t(`components_overall-statistics_tabs_herotab.pick`)"
            outlined
          />
        </v-card-text>
      </v-col>
      <v-col cols="12" md="10">
        <v-card-text>
          <played-heroes-chart :played-heroes="selectedPlayedHeroes" />
        </v-card-text>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, onMounted, ref } from "vue";
import { activeMeleeGameModesWithAT, IGameModeBrief, loadActiveGameModes } from "@/mixins/GameModesMixin";
import HeroWinrate from "@/components/overall-statistics/HeroWinrate.vue";
import PlayedHeroesChart from "@/components/overall-statistics/PlayedHeroesChart.vue";
import { EGameMode, EPick } from "@/store/types";
import { PlayedHero } from "@/store/overallStats/types";
import { useOverallStatsStore } from "@/store/overallStats/store";

export default defineComponent({
  name: "HeroTab",
  components: {
    PlayedHeroesChart,
    HeroWinrate,
  },
  props: {},
  setup() {
    const selectedHeroesPlayedPick = ref<number>(0);
    const selectedHeroesPlayedMode = ref<EGameMode>(EGameMode.GM_1ON1);
    const overallStatsStore = useOverallStatsStore();

    onMounted(async () => {
      await loadActiveGameModes();
      await overallStatsStore.loadPlayedHeroes();
    });

    const gameModes: ComputedRef<IGameModeBrief[]> = computed((): IGameModeBrief[] => activeMeleeGameModesWithAT().filter((x) => x.id !== EGameMode.GM_4ON4_AT));

    const picks = [
      {
        pickName: "overall",
        pickId: EPick.OVERALL,
      },
      {
        pickName: "first",
        pickId: EPick.FIRST,
      },
      {
        pickName: "second",
        pickId: EPick.SECOND,
      },
      {
        pickName: "third",
        pickId: EPick.THIRD,
      },
    ];

    const selectedPlayedHeroes: ComputedRef<PlayedHero[]> = computed((): PlayedHero[] => {
      const heroes = overallStatsStore.playedHeroes;
      if (heroes.length === 0) return [];
      return (
        heroes.filter((g) => g.gameMode == selectedHeroesPlayedMode.value)[0]
          ?.orderedPicks[selectedHeroesPlayedPick.value]?.stats ?? []
      );
    });

    function setSelectedHeroesPlayedPick(pick: number) {
      selectedHeroesPlayedPick.value = pick;
    }

    function setSelectedHeroesPlayedMode(mode: EGameMode) {
      selectedHeroesPlayedMode.value = mode;
    }
    return {
      selectedHeroesPlayedPick,
      selectedHeroesPlayedMode,
      gameModes,
      picks,
      selectedPlayedHeroes,
      setSelectedHeroesPlayedPick,
      setSelectedHeroesPlayedMode,
    };
  },
});
</script>
