<template>
  <v-container>
    <v-row>
      <v-col cols="7">
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title >Profile of {{ battleTag }}</v-card-title>
              <v-card-text v-if="!loadingProfile">
                <v-row>
                  <v-col cols="12">
                    <h4>Statistics by Race</h4>
                    <h5>Realm W3Champions</h5>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12">
                    <v-data-table hide-default-footer :headers="raceHeaders" :items="profile.stats">
                      <template v-slot:item.percentage="{ item }">{{ item.percentage }}%</template>
                    </v-data-table>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12">
                    <h4>Statistics by Game Mode</h4>
                    <h5>All Reams Combined W3Champions</h5>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12">
                    <v-data-table hide-default-footer :headers="modeStats" :items="profile.ladder"></v-data-table>
                  </v-col>
                </v-row>
              </v-card-text>
              <v-card-text v-if="loadingProfile" style="min-height: 500px" class="text-center">
                <v-progress-circular style="margin-top: 180px;" :size="50" color="primary" indeterminate></v-progress-circular>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="5">
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>Ranks</v-card-title>
              <v-list dense>
                <v-list-item v-for="(rank, i) in profile.ranks" :key="i">
                  <v-list-item-content>
                    <v-row>
                      <v-col cols="4">
                        <v-list-item-title
                          v-if="rank.rank > 0"
                        >{{toRank(rank.rank)}} in {{rank.title}}</v-list-item-title>
                        <v-list-item-title v-else></v-list-item-title>
                      </v-col>

                      <v-col cols="8">
                        <v-progress-linear
                          :value="(rank.level - Math.floor(rank.level)) * 100"
                          height="20"
                        >
                          <span
                            class="level"
                            v-if="rank.xp > 0"
                          >XP: {{rank.xp}} | Level: {{Math.floor(rank.level)}}</span>
                          <span class="level" v-else>unranked</span>
                        </v-progress-linear>
                        <v-list-item-title></v-list-item-title>
                      </v-col>
                    </v-row>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-text>Recent Matches</v-card-text>
              <v-list dense v-if="recentMatches.length > 0">
                <match-list-item
                  :match="match"
                  :selfBattleTag="battleTag"
                  v-for="(match, i) in recentMatches"
                  :key="i"
                ></match-list-item>
              </v-list>
              <v-card-text v-if="loadingMatches" style="min-height: 300px;" class="text-center">
                <v-progress-circular style="margin-top: 80px" :size="50" color="primary" indeterminate></v-progress-circular>
              </v-card-text>
              <v-card-text v-if="!loadingMatches && recentMatches.length === 0">
                No recent matches found
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { PlayerProfile } from "../store/player/types";
import { Match } from "../store/typings";
import MatchListItem from "../components/MatchListItem.vue";

@Component({
  components: {
    MatchListItem
  }
})
export default class PlayerView extends Vue {
  @Prop() public name!: string;
  @Prop() public tag!: string;

  public raceHeaders = [
    {
      text: "Race",
      align: "start",
      sortable: false,
      value: "race"
    },
    {
      text: "Wins",
      align: "start",
      sortable: false,
      value: "wins"
    },
    {
      text: "Losses",
      align: "start",
      sortable: false,
      value: "losses"
    },
    {
      text: "Percentage",
      align: "start",
      sortable: false,
      value: "percentage"
    }
  ];

  public modeStats = [
    {
      text: " ",
      align: "start",
      sortable: false,
      value: "type",
      width: "25px"
    },
    {
      text: "Solo",
      align: "start",
      sortable: false,
      value: "solo",
      width: "25px"
    },
    {
      text: "2on2 RT",
      align: "start",
      sortable: false,
      value: "twoOnTwo",
      width: "25px"
    },
    {
      text: "3on3 RT",
      align: "start",
      sortable: false,
      value: "threeOnThree",
      width: "25px"
    },
    {
      text: "4on4 RT",
      align: "start",
      sortable: false,
      value: "fourOnFour",
      width: "25px"
    },
    {
      text: "FFA",
      align: "start",
      sortable: false,
      value: "ffa",
      width: "25px"
    }
  ];

  get profile(): PlayerProfile {
    return this.$store.direct.state.player.playerProfile;
  }

  get loadingMatches(): boolean {
    return this.$store.direct.state.player.loadingRecentMatches;
  }

  get loadingProfile(): boolean {
    return this.$store.direct.state.player.loadingProfile;
  }

  get recentMatches(): Match[] {
    return this.$store.direct.state.player.recentMatches;
  }

  get battleTag(): string {
    return this.name + "#" + this.tag;
  }

  mounted() {
    this.$store.direct.dispatch.player.loadProfile(this.battleTag);
    this.$store.direct.dispatch.player.loadRecentMatches(this.battleTag);
  }

  public toRank(rank: number) {
    const j = rank % 10,
      k = rank % 100;
    if (j == 1 && k != 11) {
      return rank + "st";
    }
    if (j == 2 && k != 12) {
      return rank + "nd";
    }
    if (j == 3 && k != 13) {
      return rank + "rd";
    }
    return rank + "th";
  }
}
</script>

<style lang="scss" scoped>
</style>