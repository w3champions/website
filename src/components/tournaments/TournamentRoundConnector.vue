<template>
  <div class="bracket-column" style="width: 20px;" v-if="round < totalRounds">
    <div v-for="connection in numberOfConnectors" :key="connection">
      <div class="connector-element">
        <div
          class="offset-left"
          v-bind:style="getOffsetHeightConnectorOne(connection)"
        ></div>
        <div
          class="connector-left"
          v-bind:style="getHeightConnectorOne(connection)"
        ></div>
        <div style="width: 9px; height: 38px;"></div>
        <div
          style="
            width: 9px;
            height: 16px;
            border-bottom-right-radius: 3px;
            border: solid #aaa;
            border-width: 0 2px 2px 0;
          "
        ></div>
        <div style="width: 9px; height: 33px;"></div>
      </div>
      <div class="connector-element">
        <div
          class="offset-right"
          v-bind:style="getOffsetHeightConnectorTwo(connection)"
        ></div>
        <div
          class="connector-right"
        ></div>
        <div style="width: 9px; height: 22px;"></div>
        <div
          style="
            width: 9px;
            height: 6px;
            border-top-left-radius: 3px;
            border: solid #aaa;
            border-width: 2px 0 0 2px;
          "
        ></div>
        <div style="width: 9px; height: 51px;"></div>
      </div>
      <div style="clear: left;"></div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import {
  ITournamentPlayer,
  ITournamentMatch,
  ITournamentRound,
  ITournament,
} from "../../store/tournaments/types";
import { ERaceEnum } from "@/store/typings";

@Component({
  components: {},
})
export default class TournamentRoundConnector extends Vue {
  @Prop() round!: number;
  @Prop() matchesInRound!: number;
  @Prop() totalRounds!: number;

  get numberOfConnectors() {
    return this.matchesInRound / 2;
  }

  getOffsetHeightConnectorOne(connection: number) {
    let height = "0px";

    if (this.round == 1) {
      if (connection == 1) {
        height = "75px";
      } else if (connection == 2) {
        height = "37px";
      }
    } else if (this.round == 2) {
      if (connection == 1) {
        height = "111px";
      }
    }

    return { height };
  }

  getHeightConnectorOne(connection: number) {
    let height = "0px";

    if (this.round == 1) {
      height = "16px";
    } else if (this.round == 2) {
      if (connection == 1) {
        height = "52px";
      }
    }

    return { height };
  }

  getOffsetHeightConnectorTwo(connection: number) {
    let height = "0px";

    if (this.round == 1) {
      if (connection == 1) {
        height = "93px";
      } else if (connection == 2) {
        height = "55px";
      }
    } else if (this.round == 2) {
      if (connection == 1) {
        height = "165px";
      }
    }

    return { height };
  }

  getHeightConnectorTwo(connection: number) {
    let height = "0px";

    if (this.round == 1) {
      height = "51px";
    } else if (this.round == 2) {
      if (connection == 1) {
        height = "52px";
      }
    }

    return { height };
  }
}
</script>

<style lang="scss" scoped>
    .connector-element {
        float: left; 
        width: 9px;
    }

    .connector-left {
        width: 9px;
        border-top-right-radius: 3px;
        border: solid #aaa;
        border-width: 2px 2px 0 0;
    }

    .connector-right {
        width: 9px;
        height: 6px;
        border-bottom-left-radius: 3px;
        border: solid #aaa;
        border-width: 0 0 2px 2px;
    }

    .offset-left, .offset-right {
        width: 9px;
    }
</style>
