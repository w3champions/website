<template>
  <v-container class="profile">
    <v-row v-if="!loading">
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            <span class="won">{{ winnerNames }} +{{ winnerMmrGain }}</span>
            <span style="margin-left: 20px; margin-right: 20px">VS</span>
            <span class="lost">{{ looserNames }} {{ looserMmrGain }}</span>
          </v-card-title>
          <v-tabs>
            <v-tabs-slider></v-tabs-slider>
            <v-tab class="profileTab" :href="`#tab-overall`">Overall</v-tab>
            <v-tab class="profileTab" :href="`#tab-heroes`">Heroes</v-tab>

            <v-tab-item :value="'tab-overall'">
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

  get winnerNames() {
    return this.matchResult.teams[0].players.map(p => `${p.name} (${p.oldMmr})`).join(", ");
  }

  get looserNames() {
    return this.matchResult.teams[1].players.map(p => `${p.name} (${p.oldMmr})`).join(", ");
  }

  get winnerMmrGain() {
    return this.matchResult.teams[0].players[0].mmrGain;
  }

  get looserMmrGain() {
    return this.matchResult.teams[1].players[0].mmrGain;
  }

  get playerDetails() {
    return this.$store.direct.state.match.matchDetail.playerScores;
  }

  get matchResult() {
    return this.$store.direct.state.match.matchDetail.match;
  }

  get loading() {
    return this.$store.direct.state.match.loadingMatchDetail;
  }

  private async init() {
    await this.$store.direct.dispatch.match.loadMatchDetail(this.matchId);
  }
}
</script>
