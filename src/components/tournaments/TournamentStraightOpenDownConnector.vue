<template>
  <div class="connector-straight-od"
       v-bind:style="`height: ${round.dimensions.cellHeight * 2}px;`">
    <div class="connector-straight-od-top"
         v-bind:style="`height: ${round.dimensions.cellHeight - 1}px;`">
    </div>
    <div class="connector-straight-od-between"></div>
    <div class="connector-straight-od-container">
      <div class="connector-straight-od-offset"></div>
      <div class="connector-straight-od-bottom-right"></div>
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
export default class TournamentStraightConnector extends Vue {
  @Prop() round!: ITournamentRound;

}
</script>

<style lang="scss">
.connector-straight-od-container {
  display: grid;
  grid-auto-flow: column;
}

.connector-straight-od-top {
  border: solid #aaa;
  border-width: 0 0 2px 0;
}

.connector-straight-od-bottom-right {
  width: 9px;
  height: 6px;
  border-top-left-radius: 3px;
  border: solid #aaa;
  border-width: 2px 0 0 2px;
}

.connector-straight-od-offset {
  width: 9px;
  height: 6px;
}

.connector-straight-od-between {
  width: 100%;
  height: 22px;
}
</style>