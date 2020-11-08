<template>
  <div>
    <v-row>
      <v-col cols="12">
        <hero-winrate />
      </v-col>
    </v-row>
    <v-card-title>Picked Heroes</v-card-title>
    <v-row>
      <v-col cols="12" md="2">
        <v-card-text>
          <v-select
            :items="gameModes"
            item-text="modeName"
            item-value="modeId"
            v-model="selectedHeroesPlayedModeComputed"
            label="Mode"
            outlined
          />
          <v-select
            :items="picks"
            item-text="pickName"
            item-value="pickId"
            v-model="selectedHeroesPlayedPickComputed"
            label="Pick"
            outlined
          />
        </v-card-text>
        <v-card-text>
          Note: The current percentage is based on hero pick / race (tavern is separate)
        </v-card-text>
      </v-col>
      <v-col cols="12" md="10">
        <v-card-text>
          <played-heroes-chart :played-heroes="selectedPlayedHeroes" :pick="selectedPickName" :mode="selectedModeName" />
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

  get picks() {
    return [
      {
        pickName: "Overall",
        pickId: EPick.OVERALL,
      },
      {
        pickName: "First",
        pickId: EPick.FIRST,
      },
      {
        pickName: "Second",
        pickId: EPick.SECOND,
      },
      {
        pickName: "Third",
        pickId: EPick.THIRD,
      },
    ];
  }

  get selectedPlayedHeroes(): PlayedHero[] {
    const heroes = this.$store.direct.state.overallStatistics.playedHeroes;
    if (heroes.length === 0) return [];
    return (
      heroes.filter((g) => g.gameMode == this.selectedHeroesPlayedModeComputed)[0]
        ?.orderedPicks[this.selectedHeroesPlayedPickComputed]?.stats ?? []
    );
  }

  get selectedHeroesPlayedModeComputed() {
    return this.selectedHeroesPlayedMode;
  }

  set selectedHeroesPlayedModeComputed(mode) {
    this.selectedHeroesPlayedMode = mode;
  }

  get selectedHeroesPlayedPickComputed() {
    return this.selectedHeroesPlayedPick;
  }

  set selectedHeroesPlayedPickComputed(pick) {
    this.selectedHeroesPlayedPick = pick;
  }

  get selectedModeName(): string {
    return this.gameModes.find((mode: any) => mode.modeId === this.selectedHeroesPlayedModeComputed)?.modeName ?? "";
  }

  get selectedPickName(): string {
    return this.picks.find((pick: any) => pick.pickId === this.selectedHeroesPlayedPickComputed)?.pickName ?? "";
  }

  get gameModes(): any {
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
