<template>
  <div>
    <img
      v-if="renderIcon"
      :src="renderIcon"
      :title="enumToString.toString()"
      class="race-icon"
      height="24px"
      width="auto"
      :alt="enumToString.toString()"
    />
  </div>
</template>

<script lang="ts">
import { ERaceEnum } from "@/store/types";
import { Component, Prop, Vue } from "vue-facing-decorator";
import { getAsset } from "@/helpers/url-functions";

@Component({})
export default class RaceIcon extends Vue {
  public raceEnums = ERaceEnum;
  @Prop() race!: ERaceEnum;

  get enumToString() {
    return this.$t(`races.${ERaceEnum[this.race]}`);
  }

  get renderIcon() {
    if (ERaceEnum[this.race]) {
      return getAsset(`raceIcons/${ERaceEnum[this.race]}.png`);
    }
    return "";
  }
}
</script>
