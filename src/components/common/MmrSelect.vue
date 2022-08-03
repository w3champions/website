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
          v-model="range"
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

@Component({})
export default class MmrSelect extends Vue {
  @Prop() mmr!: number[];

  range: number[] = []
  previousMmr: number[] = [];
  currentMmr: number[] = [];

  mounted() {
    this.range = [this.mmr[0], this.mmr[1]];
  }

  public selectMmr(mmr: number[]): void {
    this.currentMmr = mmr;
  }

  get selected(): string {
    return (this.mmr[0] == 0 && this.mmr[1] == 3000) ? "MMR" : `${this.mmr[0]} - ${this.mmr[1]}`;
  }

  public onMenuToggled(opened: boolean): void {
    // Only send a request to backend when closing menu and selecting a different mmr.
    if (!opened && this.hasSelectedDifferentMmr()) {
      this.previousMmr = this.currentMmr;
      this.$emit("mmrChanged", this.currentMmr);
    }
  }

  public hasSelectedDifferentMmr() {
    return this.currentMmr.some((val: number, index: number) => val != this.previousMmr[index]);
  }
}
</script>

<style lang="scss" scoped>
::v-deep .v-messages {
  font-size: 15px;
}
</style>
