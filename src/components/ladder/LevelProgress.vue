<template>
  <v-progress-linear
    class="level-progress"
    :value="getProgessToNextLevel()"
    height="25"
  >
    <strong>{{ getLevelNumber() }}</strong>
  </v-progress-linear>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class LevelProgress extends Vue {
  @Prop() rp!: number;
  @Prop() maxWidth?: number;

  public getProgessToNextLevel() {
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

  ::v-deep(.v-progress-linear__background) {
    opacity: 0 !important;
  }

  ::v-deep(.v-progress-linear__determinate) {
    background-image: linear-gradient(white, var(--v-primary-lighten1), white);
  }

  &.theme--light {
    text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white;
  }

  &.theme--dark {
    background-color: black !important;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.7);
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;

    ::v-deep(.v-progress-linear__determinate) {
      background-image: linear-gradient(black, var(--v-primary-base), black);
    }
  }

  .level-progress {
    min-width: 100px;
    max-width: 200px;
  }
}
</style>
