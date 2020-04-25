<template>
  <v-container class="profile">
    <v-row v-if="!loading">
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            Grubby VS OtherDude
          </v-card-title>
          <v-tabs>
            <v-tabs-slider></v-tabs-slider>
            <v-tab class="profileTab" :href="`#tab-overall`">Overall</v-tab>
            <v-tab class="profileTab" :href="`#tab-heroes`">Heroes</v-tab>

            <v-tab-item :value="'tab-overall'">
              {{ playerDetails.length }}
            </v-tab-item>
            <v-tab-item :value="'tab-heroes'">

            </v-tab-item>
          </v-tabs>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";

@Component({})
export default class MatchDetailView extends Vue {
  @Prop() public matchId!: string;

  @Watch("matchId")
  onMatchIdChanged() {
    this.init();
  }

  mounted() {
    this.init();
  }

  get playerDetails() {
    return this.$store.direct.state.match.matchDetail?.playerScores;
  }

  get loading() {
    return this.$store.direct.state.match.loadingMatchDetail;
  }

  private async init() {
    await this.$store.direct.dispatch.match.loadMatchDetail(this.matchId);
  }
}
</script>
