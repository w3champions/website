<template>
  <v-container class="profile">
    <v-row v-if="!loading">
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            <team-match-info
              :big-race-icon="true"
              :left="true"
              :team="matchResult.teams[0]"
            ></team-match-info>
            <span style="margin-right: 30px; margin-left: 30px">VS</span>
            <team-match-info
              :big-race-icon="true"
              :team="matchResult.teams[1]"
            ></team-match-info>
          </v-card-title>
          <v-tabs>
            <v-tabs-slider></v-tabs-slider>
            <v-tab class="profileTab" :href="`#tab-overall`">Overall</v-tab>
            <v-tab class="profileTab" :href="`#tab-heroes`">Heroes</v-tab>

            <v-tab-item :value="'tab-overall'"> </v-tab-item>
            <v-tab-item :value="'tab-heroes'"> </v-tab-item>
          </v-tabs>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import TeamMatchInfo from "@/components/TeamMatchInfo.vue";

@Component({
  components: { TeamMatchInfo }
})
export default class MatchDetailView extends Vue {
  @Prop() public matchId!: string;

  @Watch("matchId")
  onMatchIdChanged() {
    this.init();
  }

  mounted() {
    this.init();
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
