<template>
  <div v-if="hero">
    <hero-picture :hero-icon="hero.icon" />
    <div class="text-center hero-level-flag" :class="firstHeroOrNot">
      <span>{{ hero.level }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Hero } from "@/store/typings";
import HeroPicture from "@/components/match-details/HeroPicture.vue";

@Component({
  components: {HeroPicture}
})
export default class HeroIcon extends Vue {
  @Prop() hero!: Hero;
  @Prop() firstHero!: boolean;

  get firstHeroOrNot() {
    return this.firstHero
      ? "hero-level-flag-first-hero"
      : "hero-level-flag-second";
  }
}
</script>

<style type="text/css" scoped>

.theme--light .hero-level-flag {
  background: rgba(52, 122, 154, 0.5);
}

.theme--dark .hero-level-flag {
  background: rgba(50, 194, 165, 0.4);
}

.hero-level-flag {
  padding-bottom: 5px;
  clip-path: polygon(0 0, 100% 0, 100% 68%, 50% 100%, 0 68%);
}

.hero-level-flag-second {
  font-size: 1.1em;
  margin-left: 17%;
  margin-right: 17%;
}

.hero-level-flag-first-hero {
  font-size: 1.5em;
  margin-left: 7%;
  margin-right: 7%;
}
</style>
