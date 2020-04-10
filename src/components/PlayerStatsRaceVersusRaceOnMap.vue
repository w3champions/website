<template>
  <v-tabs v-model="selectedTab">
    <v-tabs-slider></v-tabs-slider>
    <v-tab v-for="stat of stats" :key="stat.race" :href="`#tab-${stat.race}`">{{
      stat.race !== raceEnums.TOTAL
        ? "as " + $t("races." + raceEnums[stat.race])
        : "All races"
    }}</v-tab>
    <v-tab-item
      v-for="stat of stats"
      :key="stat.race"
      :value="'tab-' + stat.race"
    >
      <v-card-text>
        <v-row>
          <v-col cols="8">
            <race-to-map-stat :stats="stat.winLossesOnMap" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-tab-item>
  </v-tabs>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { RaceWinsOnMap } from "@/store/player/types";
import RaceToMapStat from "@/components/RaceToMapStat.vue";
import { ERaceEnum } from "@/store/typings";

@Component({
  components: { RaceToMapStat }
})
export default class PlayerStatsRaceVersusRaceOnMap extends Vue {
  @Prop() public stats!: RaceWinsOnMap[];

  public raceEnums = ERaceEnum;
  public selectedTab = "tab-1";

  mounted() {
    let maxRace = ERaceEnum.RANDOM;
    let maxGames = 0;
    this.stats
      .filter(s => s.race !== ERaceEnum.TOTAL)
      .forEach(s =>
        s.winLossesOnMap.forEach(w => {
          const gamesOfRace = w.winLosses
            .map(wl => wl.games)
            .reduce((a, b) => a + b, 0);
          if (maxGames < gamesOfRace) {
            maxRace = s.race;
            maxGames = gamesOfRace;
          }
        })
      );
    this.selectedTab = `tab-${maxRace}`;
  }
}
</script>
