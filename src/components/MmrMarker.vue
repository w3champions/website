<template>
  <v-badge overlap :content="mmr" :color="paintMMR()" />
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class MmrMarker extends Vue {
  @Prop() mmr!: number;

  paintMMR() {
    switch (this.mmr) {
      case 1:
      case 2:
        return "#805A46";
      case 3:
      case 4:
        return "#909090";
      case 5:
      case 6:
        return "#E2B007";
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
