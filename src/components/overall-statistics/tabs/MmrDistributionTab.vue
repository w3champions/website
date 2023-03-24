<template>
  <div>
    <v-row align="center">
      <v-col cols="md-2">
        <v-card-text>
          <v-select
            v-model="selectedSeason"
            :items="seasons"
            item-text="id"
            @change="setSelectedSeason"
            :label="$t(`components_overall-statistics_tabs_mmrdistributiontab.selectseason`)"
            return-object
            outlined
          />

          <v-select
            v-model="selectedGameMode"
            class="over-chart-select-box"
            :items="activeGameModes"
            item-text="name"
            item-value="id"
            @change="gameModeChanged"
            :label="$t(`components_overall-statistics_tabs_mmrdistributiontab.mode`)"
            outlined
          />
        </v-card-text>
        <v-card-text v-if="!loadingMapAndRaceStats && isGatewayNeeded()">
          <gateway-select @gatewayChanged="gatewayChanged" />
        </v-card-text>

        <v-card-text>
          {{ $t("components_overall-statistics_tabs_mmrdistributiontab.stddev") }}
          <div>{{ standardDeviation }}</div>
        </v-card-text>
        <v-card-text>
          {{ $t("components_overall-statistics_tabs_mmrdistributiontab.purplebarsdesc") }}
        </v-card-text>
        <v-card-text v-if="authCode">
          {{ $t("components_overall-statistics_tabs_mmrdistributiontab.greenbardesc") }}
        </v-card-text>
      </v-col>
      <v-col cols="md-10">
        <div class="text-center my-auto">
          <v-progress-circular indeterminate v-if="loadingData"></v-progress-circular>
        </div>
        <mmr-distribution-chart
          v-if="!loadingData"
          :mmr-distribution="mmrDistribution"
          :selected-season="selectedSeason"
          :selected-game-mode="selectedGameMode"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from "vue-property-decorator";
import GameModesMixin from "@/mixins/GameModesMixin";
import { Gateways, Season } from "@/store/ranking/types";
import { SeasonGameModeGateWayForMMR } from "@/store/overallStats/types";
import { EGameMode } from "@/store/typings";
import GatewaySelect from "@/components/common/GatewaySelect.vue";
import GameModeSelect from "@/components/common/GameModeSelect.vue";
import MmrDistributionChart from "@/components/overall-statistics/MmrDistributionChart.vue";
import { Watch } from "vue-property-decorator";
import { useOauthStore } from "@/store/oauth/store";
import { useOverallStatsStore } from "@/store/overallStats/store";

@Component({
  components: { MmrDistributionChart, GameModeSelect, GatewaySelect },
})
export default class PlayerActivityTab extends Mixins(GameModesMixin) {
  private oauthStore = useOauthStore();
  private overallStatsStore = useOverallStatsStore();
  public selectedSeason: Season = { id: 1 };
  public selectedGameMode: EGameMode = EGameMode.GM_1ON1;
  public selectedGateWay: Gateways = Gateways.Europe;
  public loadingData = true;

  get seasons() {
    return this.$store.direct.state.rankings.seasons;
  }

  get loadingMapAndRaceStats(): boolean {
    return this.overallStatsStore.loadingMapAndRaceStats;
  }

  public async setSelectedSeason(season: Season) {
    this.loadingData = true;
    this.selectedSeason = season;
    if (this.verifiedBtag) {
      await this.$store.direct.dispatch.player.loadProfile({
        battleTag: this.verifiedBtag,
        freshLogin: false,
      });
      await this.$store.direct.dispatch.player.loadGameModeStats({
        battleTag: this.verifiedBtag,
        season: season.id,
      });
    }
    this.updateMMRDistribution();
  }
  public async updateMMRDistribution() {
    const payload: SeasonGameModeGateWayForMMR = {
      season: this.selectedSeason.id,
      gameMode: this.selectedGameMode,
      gateWay: this.selectedGateWay,
    };
    await this.overallStatsStore.loadMmrDistribution(payload);
    this.loadingData = false;
  }

  gameModeChanged(gameMode: EGameMode) {
    this.selectedGameMode = gameMode;
    this.updateMMRDistribution();
  }

  gatewayChanged(gateWay: Gateways) {
    this.selectedGateWay = gateWay;
    this.updateMMRDistribution();
  }

  public isGatewayNeeded() {
    return this.selectedSeason.id <= 5;
  }

  mounted() {
    this.init();
  }

  private async init() {
    await this.loadActiveGameModes();
    await this.$store.direct.dispatch.rankings.retrieveSeasons();
    await this.setSelectedSeason(this.seasons[0]);
  }

  get verifiedBtag() {
    return this.oauthStore.blizzardVerifiedBtag;
  }

  get mmrDistribution() {
    return this.overallStatsStore.mmrDistribution;
  }

  get standardDeviation(): string {
    return this.mmrDistribution?.standardDeviation?.toString() ?? "-";
  }

  get authCode(): string {
    return this.oauthStore.token;
  }

  @Watch("verifiedBtag")
  async onBattleTagChanged(newBattleTag: string) {
    if (newBattleTag) {
      await this.$store.direct.dispatch.player.loadProfile({
        battleTag: newBattleTag,
        freshLogin: false,
      });
      await this.$store.direct.dispatch.player.loadGameModeStats({
        battleTag: newBattleTag,
        season: this.selectedSeason.id,
      });
    }
  }
}
</script>
