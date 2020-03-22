<template>
  <span :class="alignment()">
    <span class="mmr-number">{{mmr}}</span>
    <v-icon class="mmr-icon" :class="alignCorrect" :color="paintMMR">mdi-shield</v-icon>
  </span>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class MmrMarker extends Vue {
  @Prop() mmr!: number;
  @Prop() left!: boolean;

  alignment() {
    const hackClass = this.left ? "correct-hack-left" : "correct-hack-right";
    const alignClasses = this.left ? "alignLeft" : "alignRight";
    return hackClass + " " + alignClasses;
  }

  get alignCorrect() {
    switch (this.mmr) {
      case 1:
        return "mmr-icon-3";
      case 3:
      case 7:
      case 2:
        return "mmr-icon-4";
      case 4:
      case 5:
      case 6:
      case 8:
      case 9:
        return "mmr-icon-2";
      case 10:
        return "mmr-icon-1";
      default:
        return "mmr-icon-2";
    }
  }
  get paintMMR() {
    switch (this.mmr) {
      case 1:
      case 2:
        return "#805A46";
      case 3:
      case 4:
        return "#909090";
      case 5:
      case 6:
        return "#aba63a";
      case 7:
      case 8:
        return "#00A2ED";
      case 9:
      case 10:
        return "#ff6700";
      default:
        return "#805a46";
    }
  }
}
</script>

<style>
.mmr-number{
  color: #FFFFFF;
  text-align: center;
  position: fixed;
}

.correct-hack-left {
  margin-right: -19px;
}

.correct-hack-right {
  margin-right: -19px;
}

.mmr-icon-1{
  left: -6px;
}

.mmr-icon-2{
  left: -8px;
}

.mmr-icon-3{
  left: -10px;
}

.mmr-icon-4{
  left: -9px;
}

.mmr-icon{
  position: fixed;
  z-index: -1;
}
</style>
