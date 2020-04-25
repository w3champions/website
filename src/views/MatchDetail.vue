<template>
  <v-container class="profile">
    <v-row v-if="!loading">
      <v-col cols="12">
        <v-card tile>
          <v-card-title class="justify-center">
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
          <v-card-title style="margin-top: -30px !important;" class="justify-center">
            <v-card-subtitle>
              {{ $t(`mapNames.${matchResult.map}`) }} ({{ matchDuration }}) {{ playedDate }}
            </v-card-subtitle>
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import TeamMatchInfo from "@/components/TeamMatchInfo.vue";
import moment from "moment";

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

  get matchDuration() {
    return moment.utc(moment.duration(this.matchResult.durationInSeconds, "seconds").asMilliseconds()).format("mm:ss");
  }

  get playedDate() {
    return moment(this.matchResult.startTime).format("MM.DD.YY");
  }

  get matchResult() {
    return this.$store.direct.state.matches.matchDetail.match;
  }

  get loading() {
    return this.$store.direct.state.matches.loadingMatchDetail;
  }

  private async init() {
    await this.$store.direct.dispatch.matches.loadMatchDetail(this.matchId);
  }
}
</script>
