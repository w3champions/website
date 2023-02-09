<template>
  <v-progress-linear class="level-progress" :value="getProgressToNextLevel()" height="25">
    <strong>{{ getLevelNumber() }}</strong>
  </v-progress-linear>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class LevelProgress extends Vue {
  @Prop() rp!: number;

  public getProgressToNextLevel() {
    return Math.round((this.rp % 1) * 100);
  }

  public getLevelNumber() {
    return Math.floor(this.rp);
  }
}
</script>

<style lang="scss" scoped>
.level-progress {
  background-color: white !important;
  border: 1px solid rgba(0, 0, 0, 0.75);
  border-radius: 3px;
  min-width: 100px;
  max-width: 200px;
  text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white;

  ::v-deep(.v-progress-linear__background) {
    opacity: 0 !important;
  }

  ::v-deep(.v-progress-linear__determinate) {
    background-image: linear-gradient(white 0%, var(--v-primary-base) 40%, var(--v-primary-base) 60%, white 100%);
  }

  &.theme--dark {
    background-color: black !important;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.7);
    text-shadow: -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black;

    ::v-deep(.v-progress-linear__determinate) {
      background-image: linear-gradient(black, var(--v-primary-base), black);
    }
  }
}
</style>
