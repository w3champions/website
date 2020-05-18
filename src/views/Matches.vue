<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            Matches
          </v-card-title>
          <v-card-text>
            <matches-status-select />
          </v-card-text>
          <matches-grid
            v-model="matches"
            :totalMatches="totalMatches"
            @pageChanged="onPageChanged"
            :itemsPerPage="50"
            :unfinished="unfinished"
          ></matches-grid>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { Match } from "@/store/typings";
import MatchesGrid from "../components/matches/MatchesGrid.vue";
import MatchesStatusSelect from "@/components/matches/MatchesStatusSelect.vue";
import { MatchStatus } from '../store/match/types';

@Component({
  components: {
    MatchesGrid,
    MatchesStatusSelect
  }
})
export default class MatchesView extends Vue {
  onPageChanged(page: number) {
    this.getMatches(page);
  }

  get totalMatches(): number {
    return this.$store.direct.state.matches.totalMatches;
  }

  get matches(): Match[] {
    return this.$store.direct.state.matches.matches;
  }

  get unfinished(): boolean {
    return this.$store.direct.state.matches.status == MatchStatus.onGoing;
  }

  public getMatches(page?: number) {
    this.$store.direct.dispatch.matches.loadMatches(page);
  }
}
</script>
