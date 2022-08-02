<template>
  <v-menu offset-x :close-on-content-click=false @input="onMenuToggled">
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" class="transparent">
        <v-icon style="margin-right: 5px">mdi-chevron-triple-up</v-icon>
        {{selected}}
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-list>
          <v-list-item-content>
            <v-list-item-title>
              {{$t("components_common_mmrselect.selectmmr")}}
            </v-list-item-title>
          </v-list-item-content>
        </v-list>
        <v-divider></v-divider>
        <v-range-slider
          v-model="range"
          style="margin-top: 50px"
          max=3000
          min=0
          step="100"
          thumb-label="always"
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

<style></style>
