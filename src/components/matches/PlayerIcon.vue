<template>
  <span :class="[raceIcon(), alignment(), raceIconSize()]"></span>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ERaceEnum } from "@/store/typings";

@Component({})
export default class PlayerIcon extends Vue {
  @Prop() race!: ERaceEnum;
  @Prop() mmr!: number;
  @Prop() left!: boolean;
  @Prop() big!: boolean;

  raceIcon() {
    return "race-icon-" + ERaceEnum[this.race];
  }

  raceIconSize() {
    return this.big ? "race-icon-big" : "race-icon";
  }

  alignment() {
    return this.left ? "alignLeft" : "alignRight";
  }
}
</script>

<style lang="scss">
.race-icon {
  width: 32px;
  height: 32px;
  background-position: center;
  background-size: cover;
  display: inline-block;
  vertical-align: middle;
}

.race-icon-big {
  width: 36px;
  height: 36px;
  background-position: center;
  background-size: cover;
}

.race-icon-HUMAN {
  background-image: url("../../assets/raceIcons/HUMAN.png");
}

.race-icon-ORC {
  background-image: url("../../assets/raceIcons/ORC.png");
}

.race-icon-UNDEAD {
  background-image: url("../../assets/raceIcons/UNDEAD.png");
}

.race-icon-NIGHT_ELF {
  background-image: url("../../assets/raceIcons/NIGHT_ELF.png");
}

.race-icon-RANDOM {
  background-image: url("../../assets/raceIcons/RANDOM.png");
}
</style>
