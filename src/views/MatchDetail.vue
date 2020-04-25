<template>
  <v-container class="profile">
    <v-row v-if="!loading">
      <v-col cols="12">
        <v-card tile>
          <v-card-title class="justify-center">
            <v-row justify="space-around  ">
              <v-col>
                <team-match-info
                  :big-race-icon="true"
                  :left="true"
                  :team="matchResult.teams[0]"
                />
              </v-col>
              <v-col cols="1" class="text-center">
                <span>VS</span>
              </v-col>
              <v-col>
                <team-match-info
                  :big-race-icon="true"
                  :team="matchResult.teams[1]"
                />
              </v-col>
            </v-row>
          </v-card-title>
          <v-card-title
            style="margin-top: -30px !important;"
            class="justify-center"
          >
            <v-card-subtitle>
              {{ $t(`mapNames.${matchResult.map}`) }} ({{ matchDuration }})
              {{ playedDate }}
            </v-card-subtitle>
          </v-card-title>
          <v-row justify="space-between">
            <v-col cols="1" style="border: 1px solid red">
              h3
            </v-col>
            <v-col cols="1" style="border: 1px solid red">
              h2
            </v-col>
            <v-col cols="1" style="border: 1px solid red">
              h1
            </v-col>
            <v-col cols="2" style="border: 1px solid red">
              <v-row>
                <v-col align="right">
                  <v-icon class="mr-2">mdi-skull</v-icon>
                </v-col>
                <v-col>
                  3
                </v-col>
              </v-row>
              <v-row>
                <v-col align="right">
                  <v-icon class="mr-2">mdi-treasure-chest</v-icon>
                </v-col>
                <v-col>
                  1453
                </v-col>
              </v-row>
              <v-row>
                <v-col align="right">
                  <v-icon class="mr-2">mdi-chevron-triple-up</v-icon>
                </v-col>
                <v-col>
                  6
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="2" style="border: 1px solid red">
              <v-row>
                <v-col align="right">
                  3
                </v-col>
                <v-col>
                  <v-icon class="mr-2">mdi-skull</v-icon>
                </v-col>
              </v-row>
              <v-row>
                <v-col align="right">
                  1453
                </v-col>
                <v-col>
                  <v-icon class="mr-2">mdi-treasure-chest</v-icon>
                </v-col>
              </v-row>
              <v-row>
                <v-col align="right">
                  6
                </v-col>
                <v-col>
                  <v-icon class="mr-2">mdi-chevron-triple-up</v-icon>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="1" style="border: 1px solid red">
              h1
            </v-col>
            <v-col cols="1" style="border: 1px solid red">
              h2
            </v-col>
            <v-col cols="1" style="border: 1px solid red">
              h3
            </v-col>
          </v-row>
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
    return moment
      .utc(
        moment
          .duration(this.matchResult.durationInSeconds, "seconds")
          .asMilliseconds()
      )
      .format("mm:ss");
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
