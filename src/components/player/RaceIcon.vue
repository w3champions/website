<template>
  <div>
    <img
      v-if="race !== raceEnums.TOTAL"
      :src="renderIcon"
      :title="enumToString"
      class="race-icon"
      height="24px"
      width="auto"
      :alt="{ enumToString }"
    />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { ERaceEnum } from "@/store/typings";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class RaceIcon extends Vue {
  public raceEnums = ERaceEnum;
  @Prop() race!: ERaceEnum;

  get enumToString() {
    return ERaceEnum[this.race];
  }

  get renderIcon() {
    return require("../../assets/raceIcons/" + this.enumToString + ".png");
  }
}
</script>

<style lang="scss" scoped></style>
