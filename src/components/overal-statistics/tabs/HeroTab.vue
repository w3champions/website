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
            :items="gameModes"
            item-text="modeName"
            item-value="modeId"
            @change="setSelectedHeroesPlayedMode"
            :label="$t(`components_overall-statistics_tabs_herotab.mode`)"
            outlined
          />
          <v-select
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
import Vue from "vue";
import Component from "vue-class-component";
import GameLengthChart from "@/components/overal-statistics/GameLengthChart.vue";
import AmountPerDayChart from "@/components/overal-statistics/AmountPerDayChart.vue";
import PopularGameTimeChart from "@/components/overal-statistics/PopularGameTimeChart.vue";
import HeroWinrate from "@/components/overal-statistics/HeroWinrate.vue";
import PlayedHeroesChart from "@/components/overal-statistics/PlayedHeroesChart.vue";
import { EGameMode, EPick } from "@/store/typings";
import { PlayedHero } from "@/store/overallStats/types";
@Component({
  components: {
    PlayedHeroesChart,
    HeroWinrate,
    GameLengthChart,
    AmountPerDayChart,
    PopularGameTimeChart,
  },
})
export default class HeroTab extends Vue {
  public selectedHeroesPlayedPick = 0;
  public selectedHeroesPlayedMode = EGameMode.GM_1ON1;

  async mounted() {
    await this.$store.direct.dispatch.overallStatistics.loadPlayedHeroes();
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
    const heroes = this.$store.direct.state.overallStatistics.playedHeroes;
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
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_2ON2_AT]}`),
        modeId: EGameMode.GM_2ON2_AT,
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
}
</script>
