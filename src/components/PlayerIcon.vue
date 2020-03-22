<template>
  <div class="race-icon" :class="[raceIcon(), alignment()]">
    <mmr-marker class="mmr-marker-location" :mmr="mmr" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ERaceEnum } from "@/store/typings";
import MmrMarker from "@/components/MmrMarker.vue";

@Component({
  components: { MmrMarker }
})
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
}
</script>

<style lang="scss">
.race-icon {
  width: 42px;
  height: 42px;
  background-position: center;
  background-size: cover;
}

.mmr-marker-location {
  margin-left: 31px;
  margin-top: 31px;
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
