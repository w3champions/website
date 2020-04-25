<template>
  <div v-if="hero">
    <v-card-text
      class="hero-icon"
      :style="{ 'background-image': 'url(' + heroPicture + ')' }"
    />
    <div class="text-center hero-level-flag">
      <span class="hero-level-number">{{ hero.level }}</span>
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
    return require("../assets/heroes/" + this.hero.icon + ".png");
  }
}
</script>

<style type="text/css" scoped>
.hero-icon {
  padding-top: 100%;
  width: 100%;
  padding-bottom: 0 !important;
  background-repeat: no-repeat;
  background-size: contain;
}

.hero-level-flag {
  background: rgba(12, 30, 122, 0.5);
}
.hero-level-flag {
  background: rgba(12, 30, 122, 0.5);
}

.hero-level-flag {
  font-size: 1.3em;
  padding-bottom: 5px;
  margin-left: 10%;
  margin-right: 10%;
  clip-path: polygon(0 0, 100% 0, 100% 68%, 50% 100%, 0 68%);
}

.hero-level-number {
  opacity: 100% !important;
  z-index: 1000;
}
</style>
