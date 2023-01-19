<template>
  <div v-bind:style="containerStyle">
    <template v-for="index in (seriesCount / 2)">
      <tournament-round-connector
        v-bind:key="`top-${index}`"
        :index="index - 1"
        :side="'top'"
        :playerHeight="playerHeight"
        :verticalSpace="verticalSpace"
      />
      <tournament-round-connector
        v-bind:key="`bottom-${index}`"
        :index="index - 1"
        :side="'bottom'"
        :playerHeight="playerHeight"
        :verticalSpace="verticalSpace"
      />
    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import TournamentRoundConnector from "./TournamentRoundConnector.vue";

@Component({
  components: {
    TournamentRoundConnector,
  },
})
export default class TournamentRoundConnectors extends Vue {
  @Prop() public seriesCount!: number;
  @Prop() public connectorWidth!: number;
  @Prop() public playerHeight!: number;
  @Prop() public roundNameHeight!: number;
  @Prop() public verticalSpace!: number;
  @Prop() public marginTop!: number;

  get containerStyle() {
    return {
      width: `${this.connectorWidth}px`,
      "margin-top": `${this.playerHeight + this.roundNameHeight + this.marginTop}px`,
    };
  }
}
</script>
