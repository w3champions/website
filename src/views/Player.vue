<template>
  <v-container class="profile">
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            Profile of
            <span class="playerTag">{{ battleTag }}</span>
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
                    <v-tabs v-model="modeTabIndex">
                      <v-tabs-slider></v-tabs-slider>
                      <v-tab class="profileTab" href="#stats-bymode-europe">Europe</v-tab>
                      <v-tab class="profileTab" href="#stats-bymode-america">America</v-tab>
                      <v-tab-item value="stats-bymode-europe">
                        <mode-stats-grid :stats="europeStats"></mode-stats-grid>
                      </v-tab-item>
                      <v-tab-item value="stats-bymode-america">
                        <mode-stats-grid :stats="americaStats"></mode-stats-grid>
                      </v-tab-item>
                    </v-tabs>
                  </v-col>
                  <v-col cols="4">
                    <h4>Statistics by Race</h4>
                    <v-data-table hide-default-footer :headers="raceHeaders" :items="profile.stats">
                      <template v-slot:item.race="{ item }">
                        <span>{{ $t("races." + raceEnums[item.race]) }}</span>
                      </template>
                      <template v-slot:item.wins="{ item }">
                        <span class="won">{{ item.wins }}</span>
                      </template>
                      <template v-slot:item.losses="{ item }">
                        <span class="lost">{{ item.losses }}</span>
                      </template>
                      <template v-slot:item.percentage="{ item }">{{ item.percentage }}%</template>
                    </v-data-table>
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
              <v-card-title>Match History</v-card-title>
              <matches-grid
                v-model="matches"
                :totalMatches="totalMatches"
                @pageChanged="onPageChanged"
                :itemsPerPage="15"
                :alwaysLeftName="battleTag"
                :only-show-enemy="true"
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
import { PlayerProfile, ModeStat } from "../store/player/types";
import { ERaceEnum, Match } from "../store/typings";
import MatchesGrid from "../components/MatchesGrid.vue";
import ModeStatsGrid from "@/components/ModeStatsGrid.vue";

@Component({
  components: {
    MatchesGrid,
    ModeStatsGrid
  }
})
export default class PlayerView extends Vue {
  @Prop() public name!: string;
  @Prop() public tag!: string;

  public raceEnums = ERaceEnum;
  public modeTabIndex = "stats-bymode-america";

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

  @Watch("battleTag")
  onBattleTagChanged() {
    this.init();
  }

  get profile(): PlayerProfile {
    return this.$store.direct.state.player.playerProfile;
  }

  get europeStats(): ModeStat[] {
    if (this.profile && this.profile.ladder) {
      return this.profile.ladder.europe;
    }

    return [];
  }

  get americaStats(): ModeStat[] {
    if (this.profile && this.profile.ladder) {
      return this.profile.ladder.america;
    }

    return [];
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

  onPageChanged(page: number) {
    this.getMatches(page);
  }

  get totalMatches(): number {
    return this.$store.direct.state.player.totalMatches;
  }

  get matches(): Match[] {
    return this.$store.direct.state.player.matches;
  }

  public getMatches(page?: number) {
    this.$store.direct.dispatch.player.loadMatches(page);
  }

  mounted() {
    this.init();
  }

  private async init() {
    this.$store.direct.commit.player.SET_BATTLE_TAG(this.battleTag);
    this.getMatches();

    await this.$store.direct.dispatch.player.loadProfile(this.battleTag);
    const totalGamesEurope = this.europeStats[0].wins + this.europeStats[0].losses;
    const totalGamesAmerica = this.americaStats[0].wins + this.americaStats[0].losses;
    
    if (totalGamesEurope < totalGamesAmerica) {
      this.modeTabIndex = "stats-bymode-america";
    } else {
      this.modeTabIndex = "stats-bymode-europe";
    }
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

.playerTag {
  margin-left: 10px;
  text-transform: none;
}
</style>
