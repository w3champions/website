<template>
  <img
    :src="
      isDarkTheme
        ? require('./../../assets/logos/small-logo-full.png')
        : require('./../../assets/logos/small-logo-full-black.png')
    "
  />
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import Vue from "vue";

@Component({})
export default class BrandLogo extends Vue {
  @Prop() isDarkTheme!: boolean;
}
</script>

<style scoped>
img {
  max-height: 100%;
  max-width: 100%;
}
</style>
