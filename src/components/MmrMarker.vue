<template>
  <div class="mmr-marker" :class="paintMMR()" :style="setSize()">
    {{ mmr }}
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class MmrMarker extends Vue {
  @Prop() mmr!: number;
  @Prop() size = 21;

  setSize() {
    return {
      lineHeight: this.size + "px",
      height: this.size + "px",
      width: this.size + "px"
    };
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
.mmr-marker {
  border-radius: 100%;
  text-align: center;
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
