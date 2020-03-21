<template>
  <div class="race-icon" :class="[raceIcon(), alignment()]">
    <div class="mmr-marker" :class="paintMMR()">
      {{ mmr }}
    </div>
  </div>
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

  raceIcon() {
    return "race-icon-" + ERaceEnum[this.race];
  }

  alignment() {
    return this.left ? "alignLeft" : "alignRight";
  }

  paintMMR() {
    switch (this.mmr) {
      case 1:
      case 2:
        return "mmr-marker-bronze";
      case 3:
      case 4:
        return "mmr-marker-silver";
      case 5:
      case 6:
        return "mmr-marker-gold";
      case 7:
      case 8:
        return "mmr-marker-master";
      case 9:
      case 10:
        return "mmr-marker-grandmaster";
      default:
        return "mmr-marker-bronze";
    }
  }
}
</script>

<style lang="scss">
.race-icon {
  width: 64px;
  height: 64px;
}

.mmr-marker {
  width: 21px;
  height: 21px;
  font-size: 14px;
  line-height: 21px;
  border-radius: 10px;
  text-align: center;
  margin-left: 55px;
  margin-top: 54px;
}

.mmr-marker-bronze {
  background-color: #805a46;
}

.mmr-marker-silver {
  background-color: #909090;
}

.mmr-marker-gold {
  background-color: #e2b007;
}

.mmr-marker-master {
  background-color: #00a2ed;
}

.mmr-marker-grandmaster {
  background-color: #ff6700;
}

.race-icon-HUMAN {
  background-image: url("../assets/raceIcons/HUMAN.jpg");
}

.race-icon-ORC {
  background-image: url("../assets/raceIcons/ORC.jpg");
}

.race-icon-UNDEAD {
  background-image: url("../assets/raceIcons/UNDEAD.jpg");
}

.race-icon-NIGHT_ELF {
  background-image: url("../assets/raceIcons/NIGHT_ELF.jpg");
}

.race-icon-RANDOM {
  background-image: url("../assets/raceIcons/RANDOM.jpg");
}

.alignRight {
  float: right;
}

.alignLeft {
  float: left;
}
</style>
