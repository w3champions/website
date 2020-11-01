<template>
  <div>
    <v-row>
      <v-col cols="md-2">
        <v-card-text v-if="!loadingMapAndRaceStats">
          <v-select
            :items="seasons"
            item-text="id"
            @change="setSelectedSeason"
            label="Select Season"
            return-object
            outlined
          />

          <game-mode-select
              :disabledModes="disabledGameModes"
              :gameMode="selectedGameMode"
              @gameModeChanged="gameModeChanged"
            ></game-mode-select>
          
        </v-card-text>
        <v-card-text v-if="!loadingMapAndRaceStats">
          <gateway-select @gatewayChanged="gatewayChanged" />
        </v-card-text>
      
        <v-card-text>
          The purple bars mark top: 2%, 5%, 10%, 25% and 50% of players.
        </v-card-text>
        <v-card-text v-if="authCode">
          The green bar shows where you are in the distribution.
        </v-card-text>
      </v-col>
      <v-col cols="md-10">
        <mmr-distribution-chart
          :mmr-distribution="mmrDistribution"
          :selected-season="selectedSeason"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Gateways, Season } from "@/store/ranking/types";
import { SeasonGameModeGateWayForMMR } from "@/store/overallStats/types";
import { EGameMode } from '@/store/typings';
import GatewaySelect from "@/components/common/GatewaySelect.vue";
import GameModeSelect from "@/components/common/GameModeSelect.vue";
import MmrDistributionChart from "@/components/overal-statistics/MmrDistributionChart.vue";


@Component({
  components: { MmrDistributionChart,
                GameModeSelect,
                GatewaySelect },
})
export default class PlayerActivityTab extends Vue {
  public selectedSeason: Season = { id: 1 };
  public selectedGameMode: EGameMode = EGameMode.GM_1ON1;
  public selectedGateWay: Gateways = Gateways.Europe;

  get seasons() {
    return this.$store.direct.state.rankings.seasons;
  }

  get disabledGameModes() {    
    return [];
  }

   get gameModes() {
    let modes = [
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_1ON1]}`),
        gameMode: EGameMode.GM_1ON1,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_2ON2]}`),
        gameMode: EGameMode.GM_2ON2,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_2ON2_AT]}`),
        gameMode: EGameMode.GM_2ON2_AT,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_4ON4]}`),
        gameMode: EGameMode.GM_4ON4,
      },
      {
        modeName: this.$t(`gameModes.${EGameMode[EGameMode.GM_FFA]}`),
        gameMode: EGameMode.GM_FFA,
      },
    ];
    return modes;
  }

  get loadingMapAndRaceStats(): boolean {
    return this.$store.direct.state.overallStatistics.loadingMapAndRaceStats;
  }

  public async setSelectedSeason(season: Season) {
    this.selectedSeason = season;
    if (this.verifiedBtag) {
      await this.$store.direct.dispatch.player.loadProfile(this.verifiedBtag);
      await this.$store.direct.dispatch.player.loadGameModeStats({
        battleTag: this.verifiedBtag,
        season: season.id,
      });
    }
    this.updateMMRDistribution();
  }
  public async updateMMRDistribution(){
    const payload: SeasonGameModeGateWayForMMR ={season: this.selectedSeason.id, gameMode: this.selectedGameMode, gateWay: this.selectedGateWay} ;
    await this.$store.direct.dispatch.overallStatistics.loadMmrDistribution(
      payload
    );
  }

  gameModeChanged(gameMode: EGameMode) {
    this.selectedGameMode = gameMode;
    this.updateMMRDistribution();
  }

  gatewayChanged(gateWay: Gateways) {
    this.selectedGateWay = gateWay;
    this.updateMMRDistribution();
  }
  

  mounted() {
    this.init();
  }

  private async init() {
    await this.$store.direct.dispatch.rankings.retrieveSeasons();
    await this.setSelectedSeason(this.seasons[0]);
    this.updateMMRDistribution();
  }

  get verifiedBtag() {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag;
  }

  get mmrDistribution() {
    return this.$store.direct.state.overallStatistics.mmrDistribution;
  }

  get authCode(): string {
    return this.$store.direct.state.oauth.token;
  }


}
</script>
