<template>
  <v-card-text
    class="hero-icon"
    :style="{ 'background-image': 'url(' + heroPicture + ')' }"
  />
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class HeroPicture extends Vue {
  @Prop() heroIcon!: string;

  public parsePicture(hero: string) {
    return require("../../assets/heroes/" + hero + ".png");
    // try {
    //   return require("../../assets/heroes/" + hero + ".png");
    // } catch (e) {
    //   return null;
    // }
  }

  get heroPicture() {
    return this.parsePicture(this.heroIcon);
  }
}
</script>

<style type="text/css" scoped>
.hero-icon {
  z-index: 1;
  position: relative;
  padding-top: 100%;
  padding-bottom: 0;
  width: 100%;
  margin-bottom: -2px !important;
  background-repeat: no-repeat;
  background-size: contain;
}
</style>
