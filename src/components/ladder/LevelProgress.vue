<template>
  <v-progress-linear
    :value="getProgessToNextLevel(rp)"
    height="25"
    style="min-width: 100px"
  >
    <strong>{{ Math.round(rp) }}</strong>
  </v-progress-linear>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class LevelProgress extends Vue {
  @Prop() rp!: number;

  public getProgessToNextLevel(rp: number) {
    return Math.round((rp % 1) * 100)
  }
}
</script>

<style lang="scss" scoped>
.level-progress {
  background-color: white !important;
  border: 1px solid rgba(0, 0, 0, 0.75);
  border-radius: 3px;

  ::v-deep(.v-progress-linear__background) {
    opacity: 0 !important;
  }

  ::v-deep(.v-progress-linear__determinate) {
    background-image: linear-gradient(white, var(--v-primary-lighten1), white);
  }
  
  &.theme--dark {
    background-color: black !important;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.7);

    ::v-deep(.v-progress-linear__determinate) {
      background-image: linear-gradient(black, var(--v-primary-base), black);
    }
  }
}
</style>
