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
import { Component, Mixins } from "vue-property-decorator";
import GameModesMixin from "@/mixins/GameModesMixin";
import GameLengthChart from "@/components/overall-statistics/GameLengthChart.vue";
import AmountPerDayChart from "@/components/overall-statistics/AmountPerDayChart.vue";
import PopularGameTimeChart from "@/components/overall-statistics/PopularGameTimeChart.vue";
import HeroWinrate from "@/components/overall-statistics/HeroWinrate.vue";
import PlayedHeroesChart from "@/components/overall-statistics/PlayedHeroesChart.vue";
import { EGameMode, EPick } from "@/store/typings";
import { PlayedHero } from "@/store/overallStats/types";
import { useOverallStatsStore } from "@/store/overallStats/store";
@Component({
  components: {
    PlayedHeroesChart,
    HeroWinrate,
    GameLengthChart,
    AmountPerDayChart,
    PopularGameTimeChart,
  },
})
export default class HeroTab extends Mixins(GameModesMixin) {
  public selectedHeroesPlayedPick = 0;
  public selectedHeroesPlayedMode = EGameMode.GM_1ON1;
  private overallStatsStore = useOverallStatsStore();

  async mounted() {
    await this.loadActiveGameModes();
    await this.overallStatsStore.loadPlayedHeroes();
  }

  get gameModes() {
    return this.activeMeleeGameModesWithAT.filter((x) => x.id !== EGameMode.GM_4ON4_AT);
  }

  get picks() {
    return [
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
  }

  get selectedPlayedHeroes(): PlayedHero[] {
    const heroes = this.overallStatsStore.playedHeroes;
    if (heroes.length === 0) return [];
    return (
      heroes.filter((g) => g.gameMode == this.selectedHeroesPlayedMode)[0]
        ?.orderedPicks[this.selectedHeroesPlayedPick]?.stats ?? []
    );
  }

  public setSelectedHeroesPlayedPick(pick: number) {
    this.selectedHeroesPlayedPick = pick;
  }

  public setSelectedHeroesPlayedMode(mode: EGameMode) {
    this.selectedHeroesPlayedMode = mode;
  }
}
</script>
