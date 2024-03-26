<template>
  <div v-bind:style="containerStyle" v-bind:class="`connector ${side}-connector`">
    <div class="connector-row top">
      <div class="cell top-left"></div>
      <div class="cell top-right"></div>
    </div>
    <div class="connector-row bottom">
      <div class="cell bottom-left"></div>
      <div class="cell bottom-right"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-facing-decorator";

@Component
export default class TournamentRoundConnectors extends Vue {
  @Prop() public index!: number;
  @Prop() public side!: "top" | "bottom";
  @Prop() public playerHeight!: number;
  @Prop() public verticalSpace!: number;
  @Prop() public marginTop!: number;

  get containerStyle() {
    let marginTop = this.playerHeight;
    if (this.index > 0 && this.side !== "bottom") {
      marginTop += this.playerHeight + this.verticalSpace;
    }
    return {
      "margin-top": `${marginTop}px`,
      height: `${this.playerHeight / 2 + this.verticalSpace / 2}px`,
    };
  }
}
</script>

<style lang="scss">
.connector {
  box-sizing: content-box;
}
.connector-row {
  width: 100%;
  display: flex;
}
.connector-row.top {
  height: 50%;
}
.connector-row.bottom {
  height: calc(50% + 2px);
}
.connector .cell {
  width: 50%;
  border-color: grey;
  border-style: solid;
}
.top-connector {
  .top-left {
    border-width: 2px 2px 0px 0px;
    border-top-right-radius: 3px;
  }
  .top-right {
    border-width: 0px;
  }
  .bottom-left {
    border-width: 0px;
  }
  .bottom-right {
    border-width: 0px 0px 2px 2px;
    border-bottom-left-radius: 3px;
  }
}
.bottom-connector {
  .top-left {
    border-width: 0px;
  }
  .top-right {
    border-width: 2px 0px 0px 2px;
    border-top-left-radius: 3px;
  }
  .bottom-left {
    border-width: 0px 2px 2px 0px;
    border-bottom-right-radius: 3px;
  }
  .bottom-right {
    border-width: 0px;
  }
}
</style>
