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
        </v-card-text>
        <v-card-text>
          Pink bars mark top 3%, 5%, 10%, 25% and 50% of players, green is you
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
import { Season } from "@/store/ranking/types";
import MmrDistributionChart from "@/components/overal-statistics/MmrDistributionChart.vue";
@Component({
  components: { MmrDistributionChart }
})
export default class PlayerActivityTab extends Vue {
  public selectedSeason: Season = { id: 1 };

  get seasons() {
    return this.$store.direct.state.rankings.seasons;
  }

  get loadingMapAndRaceStats(): boolean {
    return this.$store.direct.state.overallStatistics.loadingMapAndRaceStats;
  }

  public async setSelectedSeason(season: Season) {
    this.selectedSeason = season;
    if (this.verifiedBtag) {
      await this.$store.direct.dispatch.player.loadProfile(this.verifiedBtag);
      await this.$store.direct.dispatch.player.loadGameModeStats(
        this.verifiedBtag
      );
    }

    await this.$store.direct.dispatch.overallStatistics.loadMmrDistribution(
      season.id
    );
  }

  mounted() {
    this.init();
  }

  private async init() {
    await this.$store.direct.dispatch.rankings.retrieveSeasons();
    await this.setSelectedSeason(this.seasons[0]);
  }

  get verifiedBtag() {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag;
  }

  get mmrDistribution() {
    return this.$store.direct.state.overallStatistics.mmrDistribution;
  }
}
</script>
