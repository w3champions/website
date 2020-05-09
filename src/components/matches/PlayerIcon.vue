<template>
  <div :class="[raceIcon(), alignment(), raceIconSize()]"></div>
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
  width: 24px;
  height: 24px;
  background-position: center;
  background-size: cover;
}

.race-icon-big {
  width: 36px;
  height: 36px;
  background-position: center;
  background-size: cover;
}

.race-icon-HUMAN {
  background-image: url("../../assets/raceIcons/HUMAN.jpg");
}

.race-icon-ORC {
  background-image: url("../../assets/raceIcons/ORC.jpg");
}

.race-icon-UNDEAD {
  background-image: url("../../assets/raceIcons/UNDEAD.jpg");
}

.race-icon-NIGHT_ELF {
  background-image: url("../../assets/raceIcons/NIGHT_ELF.jpg");
}

.race-icon-RANDOM {
  background-image: url("../../assets/raceIcons/RANDOM.jpg");
}

.alignRight {
  float: left;
  margin-right: 5px;
}

.alignLeft {
  float: right;
  margin-left: 5px;
}
</style>
