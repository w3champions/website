<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <v-card-text
        v-on="on"
        class="hero-icon"
        :style="{ 'background-image': 'url(' + heroPicture + ')' }"
      />
    </template>
    <div>{{ getName(heroIcon) }}</div>
  </v-tooltip>
</template>

<script lang="ts">
import { getAsset } from "@/helpers/url-functions";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class HeroPicture extends Vue {
  @Prop() heroIcon!: string;

  public parsePicture(hero: string) {
    try {
      return getAsset(`heroes/${hero}.png`);
    } catch (e) {
      return null;
    }
  }

  get heroPicture() {
    return this.parsePicture(this.heroIcon);
  }

  public getName(hero: string) {
    return this.$t(`heroNames.${hero}`);
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
