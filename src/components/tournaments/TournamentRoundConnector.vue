<template>
  <div
    class="bracket-column"
    style="width: 20px;"
    v-if="round && round.round < totalRounds"
  >
    <div class="connector-header"
         v-bind:style="`height: ${round.dimensions.headerHeight}px;`"></div>
    <div class="connector-connection"
         v-for="connection in numberOfConnectors"
         :key="connection">
      <tournament-straight-open-connector
        :key="`conn${round.round}`"
        :round="round"
        v-if="isStraight"
      ></tournament-straight-open-connector>
      <tournament-straight-open-down-connector
        :key="`conn${round.round}`"
        :round="round"
        v-if="isStraightDown"
      ></tournament-straight-open-down-connector>
      <tournament-y-connector
        :key="`conn${round.round}`"
        :round="round"
        v-else-if="!isStraight && !isStraightDown"
      ></tournament-y-connector>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import {
   ITournamentRound,
  ConnectionType
} from "@/store/tournaments/types";
import TournamentStraightConnector from "@/components/tournaments/TournamentStraightOpenConnector.vue";
import TournamentStraightOpenDownConnector from "@/components/tournaments/TournamentStraightOpenDownConnector.vue";
import TournamentYConnector from "@/components/tournaments/TournamentYConnector.vue";
import TournamentStraightOpenConnector from "@/components/tournaments/TournamentStraightOpenConnector.vue";

@Component({
  components: {
    TournamentStraightOpenConnector,
    TournamentStraightConnector,
    TournamentStraightOpenDownConnector,
    TournamentYConnector,
  }
})
export default class TournamentRoundConnector extends Vue {
  @Prop() round!: ITournamentRound;
  @Prop() matchesInRound!: number;
  @Prop() totalRounds!: number;

  get numberOfConnectors() {
    let connections = this.matchesInRound;

    if (!this.isStraight) {
      connections = this.matchesInRound / 2;
    }

    const result = [];
    for (let index = 0; index < connections; index++) {
      result.push(index + 1);
    }

    return result;
  }

  get isStraight() {
    return (
      this.round.connectionType &&
      this.round.connectionType == ConnectionType.StraightOpen
    );
  }

  get isStraightDown() {
    return (
      this.round.connectionType &&
      this.round.connectionType == ConnectionType.StraightOpenDown
    );
  }
}
</script>

<style lang="scss">
.connector-connection {
  display: grid;
}
</style>
