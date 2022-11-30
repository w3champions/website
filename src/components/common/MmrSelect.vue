<template>
  <v-menu offset-x :close-on-content-click=false @input="onMenuToggled">
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" class="transparent">
        <v-icon class="mr-1">mdi-chevron-triple-up</v-icon>
        {{selected}}
      </v-btn>
    </template>
    <v-card class="px-2 pt-2">
      <v-card-text>
        <v-range-slider
          v-model="currentMinMax"
          max=3000
          min=0
          step="100"
          thumb-label="always"
          :hint="$t('components_common_mmrselect.selectmmr')"
          persistent-hint
          class="pt-7"
          style="min-width: 300px"
          @change="selectMmr"
        ></v-range-slider>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Mmr } from "@/store/match/types";

@Component({})
export default class MmrSelect extends Vue {
  @Prop() mmr!: Mmr;

  previousMmr = {} as Mmr;
  currentMmr = {min: 0, max: 3000} as Mmr;
  currentMinMax: number[] = [this.currentMmr.min, this.currentMmr.max];

  public selectMmr(selectedMmr: number[]): void {
    this.currentMmr.min = selectedMmr[0];
    this.currentMmr.max = selectedMmr[1];
  }

  get selected(): string {
    return (this.mmr.min == 0 && this.mmr.max == 3000) ? "MMR" : `${this.mmr.min} - ${this.mmr.max}`;
  }

  public onMenuToggled(opened: boolean): void {
    // Only send a request to backend when closing menu and selecting a different mmr.
    if (!opened && this.hasSelectedDifferentMmr()) {
      this.previousMmr.min = this.currentMmr.min;
      this.previousMmr.max = this.currentMmr.max;
      this.$emit("mmrChanged", this.currentMmr);
    }
  }

  public hasSelectedDifferentMmr() {
    return this.currentMmr.min != this.previousMmr.min || this.currentMmr.max != this.previousMmr.max;
  }
}
</script>

<style lang="scss" scoped>
::v-deep(.v-messages) {
  font-size: 15px;
}

::v-deep(.theme--dark .v-slider__thumb-label) {
  color: black;
}
</style>
