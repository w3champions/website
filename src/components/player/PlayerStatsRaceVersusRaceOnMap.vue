<template>
  <v-tabs v-model="selectedTab">
    <v-tabs-slider></v-tabs-slider>
    <v-tab v-for="stat of stats" :key="stat.race" :href="`#tab-${stat.race}`">
      <span v-if="stat.race === raceEnums.TOTAL">All races</span>
      <race-icon :race="stat.race" />
    </v-tab>

    <v-tab-item
      v-for="stat of stats"
      :key="stat.race"
      :value="'tab-' + stat.race"
    >
      <v-card-text>
        <v-row>
          <v-col cols="md-12">
            <race-to-map-stat :stats="stat.winLossesOnMap" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-tab-item>
  </v-tabs>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import { RaceWinsOnMap } from "@/store/player/types";
import RaceToMapStat from "@/components/overal-statistics/RaceToMapStat.vue";
import { ERaceEnum } from "@/store/typings";
import RaceIcon from "@/components/player/RaceIcon.vue";

@Component({
  components: { RaceToMapStat, RaceIcon },
})
export default class PlayerStatsRaceVersusRaceOnMap extends Vue {
  @Prop() public stats!: RaceWinsOnMap[];

  public raceEnums = ERaceEnum;
  public selectedTab = "tab-1";

  get isPlayerInitialized(): boolean {
    return this.$store.direct.state.player.isInitialized;
  }

  mounted(): void {
    if (this.isPlayerInitialized) {
      this.setSelectedTab();
    }
  }

  // When loading the statistics tab via URL directly, due to Lifecycle Hooks the mounted() here
  // is called before mounted of player, which this depends on. For this case isPlayerInitialized
  // is being watched to set the tab once player.vue init() has finished.
  @Watch("isPlayerInitialized")
  onPlayerInitialized(): void {
    this.setSelectedTab();
  }

  setSelectedTab(): void {
    let maxRace = ERaceEnum.RANDOM;
    let maxGames = 0;
    this.stats
      .filter((s) => s.race !== ERaceEnum.TOTAL)
      .forEach((s) =>
        s.winLossesOnMap.forEach((w) => {
          const gamesOfRace = w.winLosses
            .map((wl) => wl.games)
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
