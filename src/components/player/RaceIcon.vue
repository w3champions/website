<template>
  <div>
    <img
      v-if="renderIcon"
      :src="renderIcon"
      :title="enumToString"
      class="race-icon"
      height="24px"
      width="auto"
      :alt="enumToString"
    />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { ERaceEnum } from "@/store/typings";
import { Component, Prop } from "vue-property-decorator";
import { WEBSITE_ASSETS_URL } from "@/main";

@Component({})
export default class RaceIcon extends Vue {
  public raceEnums = ERaceEnum;
  @Prop() race!: ERaceEnum;

  get enumToString() {
    return this.$t(`races.${ERaceEnum[this.race]}`);
  }

  get renderIcon() {
    if (ERaceEnum[this.race]) {
      return `${WEBSITE_ASSETS_URL}/raceIcons/${ERaceEnum[this.race]}.png`;
    }
    return "";
  }
}
</script>
