<template>
  <div
    class="bracket-column"
    style="width: 20px;"
    v-if="round && round.round < totalRounds"
  >
    <div v-for="connection in numberOfConnectors" :key="connection">
      <div class="connector-element">
        <div
          v-if="!isStraight"
          class="offset-left"
          v-bind:style="getOffsetLeftStyles(connection)"
        ></div>
        <div
          v-if="!isStraight"
          v-bind:style="getLeftStyles(connection)"
          v-bind:class="getLeftClass(connection)"
        ></div>
        <div v-if="!isStraight" class="offset-between-left"></div>
        <div
          v-if="!isStraightDown"
          v-bind:class="getBottomLeftClass()"
          v-bind:style="getHeightConnectorBottomLeft(connection)"
        ></div>
        <div v-if="!isStraight" class="offset-bottom-left"></div>
      </div>
      <div class="connector-element">
        <div
          class="offset-right"
          v-bind:style="getOffsetRightHeight(connection)"
        ></div>
        <div v-bind:class="getRightClass()"></div>
        <div
          v-bind:style="getOffsetBetweenRightStyles()"
          class="offset-between-right"
        ></div>
        <div v-bind:class="getBottomRightClass()"></div>
        <div v-if="!isStraight" class="offset-bottom-right"></div>
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
  ConnectionType,
} from "../../store/tournaments/types";
import { ERaceEnum } from "@/store/typings";
import router from "@/router";

@Component({
  components: {},
})
export default class TournamentRoundConnector extends Vue {
  @Prop() round!: ITournamentRound;
  @Prop() prevRound!: ITournamentRound;
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

  getOffsetLeftStyles(connection: number) {
    let height = "0px";

    if (this.isStraight) {
      return { height };
    }

    if (this.round.dimensions) {
      if (connection == 1) {
        height =
          this.round.dimensions?.headerHeight +
          this.round.dimensions?.cellHeight +
          -1 +
          "px";
      } else {
        height = this.round.dimensions?.cellHeight + 1 + "px";
      }
    }

    return { height };
  }

  getLeftStyles(connection: number) {
    let height = "0px";

    if (this.isStraight) {
      return { height };
    }

    if (this.round.dimensions) {
      let roundNumber = this.round.round;
      if (
        this.prevRound &&
        this.prevRound.connectionType == ConnectionType.StraightOpen
      ) {
        roundNumber = this.prevRound.round;
      }
      height =
        this.round.dimensions?.cellHeight / 2 +
        (this.round.dimensions?.headerHeight / 2) * (roundNumber - 1) -
        2 * roundNumber +
        "px";
    }

    return { height };
  }

  getLeftClass(connection: number) {
    if (this.round.connectionType == ConnectionType.StraightOpenDown) {
      return "connector-left-straight";
    }

    return "connector-left";
  }

  getRightClass() {
    if (this.round.connectionType == ConnectionType.StraightOpenDown) {
      return "connector-right-straight";
    }

    return "connector-right";
  }

  getOffsetRightHeight(connection: number) {
    let height = "0px";

    if (this.isStraight) {
      if (this.round.dimensions) {
        if (connection == 1) {
          const cellHeightPart =
            this.round.dimensions?.cellHeight > 36
              ? this.round.dimensions?.cellHeight / 2
              : 0;

          height =
            this.round.dimensions?.headerHeight + cellHeightPart + 6 + "px";
        } else {
          height = this.round.dimensions?.cellHeight + 5 + "px";
        }
      }
      return { height };
    }

    if (this.isStraightDown) {
      if (this.round.dimensions) {
        if (connection == 1) {
          const cellHeightPart =
            this.round.dimensions?.cellHeight > 36
              ? this.round.dimensions?.cellHeight - 13
              : 0;

          height =
            this.round.dimensions?.headerHeight + cellHeightPart + 6 + "px";
        } else {
          height = this.round.dimensions?.cellHeight + 5 + "px";
        }
      }
      return { height };
    }

    if (this.round.dimensions) {
      if (connection == 1) {
        height =
          this.round.dimensions?.headerHeight / 2 +
          this.round.dimensions?.cellHeight * 2 +
          +1 +
          "px";
      } else {
        height = this.round.dimensions?.cellHeight + 19 + "px";
      }
    }

    return { height };
  }

  getHeightConnectorBottomLeft(connection: number) {
    let height = "16px";

    if (this.isStraight) {
      if (this.round.dimensions) {
        if (connection == 1) {
          height =
            this.round.dimensions?.headerHeight +
            this.round.dimensions?.cellHeight -
            1 +
            "px";
        } else {
          height = this.round.dimensions?.cellHeight + 34 + "px";
        }
      }
      return { height };
    }

    if (this.round.dimensions) {
      let roundNumber = this.round.round;
      if (
        this.prevRound &&
        this.prevRound.connectionType == ConnectionType.StraightOpen
      ) {
        roundNumber = this.prevRound.round;
      }
      height =
        this.round.dimensions?.cellHeight / 2 +
        (this.round.dimensions?.headerHeight / 2) * (roundNumber - 1) -
        2 * roundNumber +
        "px";
    }

    return { height };
  }

  getOffsetBetweenRightStyles() {
    let height = "22px";

    if (this.isStraight) {
      height = "0";
      return { height };
    }

    return { height };
  }

  getBottomLeftClass() {
    if (this.round.connectionType == ConnectionType.StraightOpen) {
      return "connector-bottom-left-straight";
    }

    return "connector-bottom-left";
  }

  getBottomRightClass() {
    if (this.round.connectionType == ConnectionType.StraightOpen) {
      return "connector-bottom-right-straight";
    }

    return "connector-bottom-right";
  }
}
</script>

<style lang="scss" scoped>
*,
::before,
::after {
  -webkit-box-sizing: content-box;
  box-sizing: content-box;
}

.connector-element {
  float: left;
  width: 9px;
  box-sizing: content-box;
}

.connector-left {
  width: 9px;
  border-top-right-radius: 3px;
  border: solid #aaa;
  border-width: 2px 2px 0 0;
}

.connector-left-straight {
  width: 9px;
  border: solid #aaa;
  border-width: 2px 0 0 0;
}

.connector-right {
  width: 9px;
  height: 6px;
  border-bottom-left-radius: 3px;
  border: solid #aaa;
  border-width: 0 0 2px 2px;
}

.connector-right-straight {
  width: 11px;
  height: 6px;
  border: solid #aaa;
  border-width: 0 0 2px 0px;
}

.connector-bottom-left {
  width: 9px;
  height: 16px;
  border-bottom-right-radius: 3px;
  border: solid #aaa;
  border-width: 0 2px 2px 0;
}

.connector-bottom-left-straight {
  width: 9px;
  border-bottom: solid #aaa 2px;
}

.connector-bottom-right {
  width: 9px;
  height: 6px;
  border-top-left-radius: 3px;
  border: solid #aaa;
  border-width: 2px 0 0 2px;
}

.connector-bottom-right-straight {
  width: 11px;
  height: 21px;
  border-bottom: solid #aaa 2px;
}

.offset-left,
.offset-right {
  width: 9px;
}

.offset-between-right {
  width: 9px;
  height: 22px;
}

.offset-between-left {
  width: 9px;
  height: 38px;
}

.offset-bottom-left {
  width: 9px;
  height: 33px;
}

.offset-bottom-right {
  width: 9px;
  height: 51px;
}
</style>
