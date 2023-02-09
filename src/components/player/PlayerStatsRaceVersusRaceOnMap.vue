<template>
  <v-tabs v-model="selectedTab" v-if="!isEmpty">
    <v-tabs-slider></v-tabs-slider>
    <v-tab v-for="stat of stats" :key="stat.race" :href="`#tab-${stat.race}`">
      <span v-if="stat.race === raceEnums.TOTAL">
        {{ $t("common.allraces") }}
      </span>
      <race-icon v-else :race="stat.race" />
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
  <v-card-text v-else>
    {{ $t("components_player_tabs_playerstatistictab.playerhasnomatches") }}
  </v-card-text>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import { RaceWinsOnMap } from "@/store/player/types";
import RaceToMapStat from "@/components/overall-statistics/RaceToMapStat.vue";
import { ERaceEnum } from "@/store/typings";
import RaceIcon from "@/components/player/RaceIcon.vue";
import _ from "lodash";
import { defaultStatsTab } from "@/helpers/profile";

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

  // Use activated() instead of mounted() to trigger when navigating directly from one profile to another.
  activated(): void {
    if (this.isPlayerInitialized) this.setSelectedTab();
  }

  get isEmpty(): boolean {
    return _.isEmpty(this.stats);
  }

  // When loading the statistics tab via URL directly, due to Lifecycle Hooks the mounted() here
  // is called before mounted of player, which this depends on. For this case isPlayerInitialized
  // is being watched to set the tab once player.vue init() has finished.
  @Watch("isPlayerInitialized")
  onPlayerInitialized(): void {
    this.setSelectedTab();
  }

  setSelectedTab(): void {
    this.selectedTab = defaultStatsTab(this.stats);
  }
}
</script>
