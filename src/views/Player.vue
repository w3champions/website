<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        
        <v-card>
          <v-card-title>Profile of {{ battleTag }}</v-card-title>
          <v-card-text v-if="!loadingProfile">
            <v-row>
              <v-col cols="6">
                <h4>Statistics by Game Mode</h4>
                <h5>All Reams Combined W3Champions</h5>
                <v-data-table hide-default-footer :headers="modeStats" :items="profile.ladder"></v-data-table>
              </v-col>
              <v-col cols="6">
                <h4>Statistics by Race</h4>
                <h5>Realm W3Champions</h5>
                <v-data-table hide-default-footer :headers="raceHeaders" :items="profile.stats">
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
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Match history</v-card-title>
          <matches-grid
            v-model="matches"
            :totalMatches="totalMatches"
            @pageChanged="onPageChanged"
            itemsPerPage="15"
          ></matches-grid>
        </v-card>
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
import MatchesGrid from "../components/MatchesGrid.vue";

@Component({
  components: {
    MatchListItem,
    MatchesGrid
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
      align: "end",
      sortable: false,
      value: "solo",
      width: "25px"
    },
    {
      text: "2on2 RT",
      align: "end",
      sortable: false,
      value: "twoOnTwo",
      width: "25px"
    },
    {
      text: "3on3 RT",
      align: "end",
      sortable: false,
      value: "threeOnThree",
      width: "25px"
    },
    {
      text: "4on4 RT",
      align: "end",
      sortable: false,
      value: "fourOnFour",
      width: "25px"
    },
    {
      text: "FFA",
      align: "end",
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

  get battleTag(): string {
    return this.name + "#" + this.tag;
  }

  // TODO
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
    this.$store.direct.commit.player.SET_BATTLE_TAG(this.battleTag);
    this.$store.direct.dispatch.player.loadProfile(this.battleTag);
    this.getMatches();
  }
}
</script>

<style lang="scss" scoped>
</style>