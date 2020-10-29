<template>
  <div>
    <v-row align="center">
      <v-col cols="md-2">
        <v-card-text>
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
          The purple bars mark top: 2%, 5%, 10%, 25% and 50% of players.
        </v-card-text>
        <v-card-text v-if="authCode">
          The green line shows where you are in the distribution.
        </v-card-text>
      </v-col>
      <v-col cols="md-10">
        <div class="text-center my-auto">
          <v-progress-circular
            indeterminate
            v-if="loadingData"
          ></v-progress-circular>
        </div>
        <mmr-distribution-chart
          v-if="!loadingData"
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
  components: { MmrDistributionChart },
})
export default class PlayerActivityTab extends Vue {
  public selectedSeason: Season = { id: 1 };
  private loadingData = true;

  get seasons() {
    return this.$store.direct.state.rankings.seasons;
  }

  public async setSelectedSeason(season: Season) {
    this.loadingData = true;
    this.selectedSeason = season;
    if (this.verifiedBtag) {
      await this.$store.direct.dispatch.player.loadProfile(this.verifiedBtag);
      await this.$store.direct.dispatch.player.loadGameModeStats({
        battleTag: this.verifiedBtag,
        season: season.id,
      });
    }

    await this.$store.direct.dispatch.overallStatistics.loadMmrDistribution(
      season.id
    );
    this.loadingData = false;
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

  get authCode(): string {
    return this.$store.direct.state.oauth.token;
  }
}
</script>
