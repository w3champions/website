<template>
  <div v-if="hero">
    <v-card-text
      class="hero-icon"
      :style="{ 'background-image': 'url(' + heroPicture + ')' }"
    />
    <div class="text-center hero-level-flag">
      <span>{{ hero.level }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Hero } from "@/store/typings";

@Component({})
export default class HeroIcon extends Vue {
  @Prop() hero!: Hero;

  get heroPicture() {
    try {
      return require("../assets/heroes/" + this.hero.icon + ".png");
    } catch (e) {
      console.log(`Did not find ${this.hero.icon}!`);
      return null;
    }
  }
}
</script>

<style type="text/css" scoped>
.hero-icon {
  z-index: 1;
  position: relative;
  margin-top: 12px;
  padding-top: 100%;
  width: 100%;
  padding-bottom: 0 !important;
  margin-bottom: -2px !important;
  background-repeat: no-repeat;
  background-size: contain;
}

.theme--light .hero-level-flag {
  background: rgba(52, 122, 154, 0.5);
}

.theme--dark .hero-level-flag {
  background: rgba(50, 194, 165, 0.4);
}

.hero-level-flag {
  font-size: 1.3em;
  padding-bottom: 5px;
  margin-left: 10%;
  margin-right: 10%;
  clip-path: polygon(0 0, 100% 0, 100% 68%, 50% 100%, 0 68%);
}
</style>
