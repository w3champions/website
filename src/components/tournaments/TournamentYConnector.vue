<template>
  <div class="connector-y">
    <div class="connector-y-top" v-bind:style="`height: ${round.dimensions.cellHeight * 2}px;`">
      <div class="connector-y-container">
        <div class="connector-y-top-left"></div>
        <div class="connector-y-offset"></div>
      </div>
      <div class="connector-y-container">
        <div v-bind:style="getLineStyle()" class="connector-y-line"></div>
        <div v-bind:style="getLineStyle()"></div>
      </div>
      <div class="connector-y-container">
        <div class="connector-y-offset"></div>
        <div class="connector-y-top-right"></div>
      </div>
      <div class="connector-y-between"></div>
    </div>
    <div class="connector-y-bottom" v-bind:style="`height: ${round.dimensions.cellHeight * 2}px;`">
      <div class="connector-y-between"></div>
      <div class="connector-y-container">
        <div class="connector-y-offset"></div>
        <div class="connector-y-bottom-right"></div>
      </div>
      <div class="connector-y-container">
        <div v-bind:style="getLineStyle()" class="connector-y-line"></div>
        <div v-bind:style="getLineStyle()"></div>
      </div>
      <div class="connector-y-container">
        <div class="connector-y-bottom-left"></div>
        <div class="connector-y-offset"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import {
  ITournamentRound} from "@/store/tournaments/types";

@Component({
  components: {}
})
export default class TournamentYConnector extends Vue {
  @Prop() round!: ITournamentRound;

  getLineStyle() {
    const middle_offset = 3;
    const arc_height = 6;
    const between_offset = 11;
    const height = (this.round?.dimensions?.cellHeight ?? 20)
      - 2 * arc_height
      - between_offset
      - middle_offset;
    return { height: `${height}px`, width: "9px" };
  }
}
</script>

<style lang="scss">
.connector-y {
  display: grid;
}

.connector-y-container {
  display: grid;
  grid-auto-flow: column;
}

.connector-y-top,
.connector-y-bottom {
  display: grid;
}

.connector-y-top {
  align-content: end;
}

.connector-y-bottom {
  align-content: start;
}

.connector-y-line {
  border: solid #aaa;
  border-width: 0 2px 0 0;
}

.connector-y-top-left {
  width: 9px;
  height: 6px;
  border-top-right-radius: 3px;
  border: solid #aaa;
  border-width: 2px 2px 0 0;
}

.connector-y-top-right {
  width: 9px;
  height: 6px;
  border-bottom-left-radius: 3px;
  border: solid #aaa;
  border-width: 0 0 2px 2px;
}

.connector-y-bottom-left {
  width: 9px;
  height: 6px;
  border-bottom-right-radius: 3px;
  border: solid #aaa;
  border-width: 0 2px 2px 0;
}

.connector-y-bottom-right {
  width: 9px;
  height: 6px;
  border-top-left-radius: 3px;
  border: solid #aaa;
  border-width: 2px 0 0 2px;
}

.connector-y-offset {
  width: 9px;
  height: 6px;
}

.connector-y-between {
  width: 100%;
  height: 11px;
}
</style>