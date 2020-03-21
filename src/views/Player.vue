<template>
  <v-container class="profile">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            Profile of {{ battleTag }} (
            <v-icon>mdi-chevron-triple-up</v-icon>
            {{ mmr }})
          </v-card-title>
          <v-tabs>
            <v-tabs-slider></v-tabs-slider>
            <v-tab class="profileTab" :href="`#tab-1`">Profile</v-tab>
            <v-tab class="profileTab" :href="`#tab-2`">Match History</v-tab>
            <v-tab-item :value="'tab-1'">
              <v-card-title>Stats</v-card-title>
              <v-card-text v-if="!loadingProfile">
                <v-row>
                  <v-col cols="8">
                    <h4>Statistics by Game Mode</h4>
                    <h5>All Reams Combined W3Champions</h5>
                    <v-data-table hide-default-footer :headers="modeStats" :items="profile.ladder">
                      <template v-slot:body="{ items }">
                        <tbody>
                          <tr
                            @click="openPlayerProfile(item.battleTag)"
                            v-for="item in items"
                            :key="item.mode"
                          >
                            <td>{{item.mode}}</td>
                            <td class="text-end won">{{item.wins}}</td>
                            <td class="text-end lost">{{item.losses}}</td>
                            <td class="text-end">{{item.wins + item.losses}}</td>
                            <td class="text-end">{{getWinRate(item).toFixed(1)}}%</td>
                            <td class="text-end">{{item.rank}}</td>
                            <td class="text-end">{{Math.floor(item.level)}}</td>
                            <td>
                              <xp-bar :ranking="item"></xp-bar>
                            </td>
                          </tr>
                        </tbody>
                      </template>
                    </v-data-table>
                  </v-col>
                  <v-col cols="4">
                    <h4>Statistics by Race</h4>
                    <h5>Realm W3Champions</h5>
                    <v-data-table hide-default-footer :headers="raceHeaders" :items="profile.stats">
                      <template v-slot:item.wins="{ item }">
                        <span class="won">{{ item.wins }}</span>
                      </template>
                      <template v-slot:item.losses="{ item }">
                        <span class="lost">{{ item.losses }}</span>
                      </template>
                      <template v-slot:item.percentage="{ item }">{{ item.percentage }}%</template>
                    </v-data-table>
                    <RaceSpiderChart v-bind:stats="profile.stats" />
                  </v-col>
                </v-row>
              </v-card-text>
              <v-card-text v-if="loadingProfile" style="min-height: 500px" class="text-center">
                <v-progress-circular
                  style="margin-top: 180px;"
                  :size="50"
                  color="primary"
                  indeterminate
                ></v-progress-circular>
              </v-card-text>
            </v-tab-item>
            <v-tab-item :value="'tab-2'">
              <v-card-title>Match history</v-card-title>
              <matches-grid
                v-model="matches"
                :totalMatches="totalMatches"
                @pageChanged="onPageChanged"
                :itemsPerPage="15"
                :alwaysLeftName="battleTag"
              ></matches-grid>
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
import { PlayerProfile } from "../store/player/types";
import { Match } from "../store/typings";
import MatchListItem from "../components/MatchListItem.vue";
import MatchesGrid from "../components/MatchesGrid.vue";
import { Ranking } from "../store/ranking/types";
import XpBar from "../components/XpBar.vue";
import RaceSpiderChart from "@/components/RaceSpiderChart.vue";

@Component({
  components: {
    MatchListItem,
    MatchesGrid,
    XpBar,
    RaceSpiderChart
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
      text: "Winrate",
      align: "start",
      sortable: false,
      value: "percentage"
    }
  ];

  public modeStats = [
    {
      text: "Mode",
      align: "start",
      sortable: false,
      value: "type",
      width: "25px"
    },
    {
      text: "Wins",
      align: "end",
      sortable: false,
      value: "wins",
      width: "25px"
    },
    {
      text: "Losses",
      align: "end",
      sortable: false,
      value: "losses",
      width: "25px"
    },
    {
      text: "Total",
      align: "end",
      sortable: false,
      value: "total",
      width: "25px"
    },
    {
      text: "Winrate",
      align: "end",
      sortable: false,
      value: "percentage",
      width: "25px"
    },
    {
      text: "Rank",
      align: "end",
      sortable: false,
      value: "fourOnFour",
      width: "25px"
    },
    {
      text: "Level",
      align: "end",
      sortable: false,
      value: "level",
      width: "25px"
    },
    {
      text: "Progress",
      align: "center",
      sortable: false,
      value: "progress",
      width: "100px"
    }
  ];

  @Watch("battleTag")
  onBattleTagChanged() {
    this.init();
  }

  get profile(): PlayerProfile {
    return this.$store.direct.state.player.playerProfile;
  }

  get loadingMatches(): boolean {
    return this.$store.direct.state.player.loadingRecentMatches;
  }

  get loadingProfile(): boolean {
    return this.$store.direct.state.player.loadingProfile;
  }

  get battleTag(): string {
    return this.name + "#" + this.tag;
  }

  public getWinRate(rank: Ranking) {
    const winRate = (rank.wins * 100) / (rank.wins + rank.losses);

    if (isNaN(winRate)) {
      return 0;
    }

    return winRate;
  }
  onPageChanged(page: number) {
    this.getMatches(page);
  }

  get totalMatches(): number {
    return this.$store.direct.state.player.totalMatches;
  }

  get matches(): Match[] {
    return this.$store.direct.state.player.matches;
  }

  get mmr() {
    if (!this.profile.ladder) {
      return 0;
    }

    return this.profile.ladder.filter(x => x.mode === "1on1")[0].bucket;
  }

  public getMatches(page?: number) {
    this.$store.direct.dispatch.player.loadMatches(page);
  }

  mounted() {
    this.init();
  }

  private init() {
    this.$store.direct.commit.player.SET_BATTLE_TAG(this.battleTag);
    this.$store.direct.dispatch.player.loadProfile(this.battleTag);
    this.getMatches();
  }
}
</script>

<style lang="scss" scoped>
.profileTab {
  background-color: #f5f5f5;
}

.theme--dark {
  .profileTab {
    background-color: #2f2f2f;
  }
}
</style>
