<template>
  <v-card-text
    class="hero-icon"
    :style="{ 'background-image': 'url(' + heroPicture + ')' }"
  />
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Hero } from "@/store/typings";

@Component({})
export default class HeroPicture extends Vue {
  @Prop() heroIcon!: string;

  get heroPicture() {
    try {
      return require("../../assets/heroes/" + this.heroIcon + ".png");
    } catch (e) {
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
</style>
