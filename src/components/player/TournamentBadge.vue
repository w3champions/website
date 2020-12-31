<template>
  <v-tooltip top v-if="tournament">
    <template v-slot:activator="{ on }">
      <div
        @click="() => onClick(tournament)"
        v-on="on"
        class="tournament-badge pointer"
        :style="{ 'background-image': 'url(' + tournamentBadgeBg + ')' }"
      />
    </template>
    <span>{{ tournamentTooltip }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { getAsset } from "@/helpers/url-functions";
import { Tournament } from "@/store/player/types";

@Component({})
export default class TournamentBadge extends Vue {
  @Prop() tournament!: Tournament;
  @Prop() onClick!: (tournament: Tournament) => void;

  get seasonId() {
    return this.tournament.seasonId;
  }

  get tournamentBadgeBg() {
    let trophyName: string;
    switch (this.tournament.place) {
      case 1: {
        trophyName = "Gold";
        break;
      }
      case 2: {
        trophyName = "Silver";
        break;
      }
      case 3: {
        trophyName = "Bronze";
        break;
      }
      default: {
        trophyName = "Black";
        break;
      }
    }

    return getAsset(
      `tournamentBadges/${this.tournament.seasonId}_${trophyName}.png`
    );
  }

  get tournamentTooltip() {
    let tooltip: string;
    switch (this.tournament.place) {
      case 1: {
        tooltip = `placed 1st in season ${this.seasonId} tournament`;
        break;
      }
      case 2: {
        tooltip = `placed 2nd in season ${this.seasonId} tournament`;
        break;
      }
      case 3: {
        tooltip = `placed 3rd in season ${this.seasonId} tournament`;
        break;
      }
      default: {
        tooltip = `participated in season ${this.seasonId} tournament`;
        break;
      }
    }
    return tooltip;
  }
}
</script>

<style lang="scss" scoped>
.tournament-badge {
  margin-right: 10px;
  width: 24px;
  height: 24px;
  background-size: cover;
}
</style>
