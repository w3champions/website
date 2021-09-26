<template>
  <div class="connector-straight-open"
       v-bind:style="`height: ${round.dimensions.cellHeight * 2}px;`">
    <div class="connector-straight-open-top"
         v-bind:style="`height: ${round.dimensions.cellHeight - 1}px;`">
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
.connector-straight-open-top {
  border: solid #aaa;
  border-width: 0 0 2px 0;
}
</style>