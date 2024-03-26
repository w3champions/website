<template>
  <img
    :src="
      isDarkTheme
        ? '/assets/logos/small-logo-full.png'
        : '/assets/logos/small-logo-full-black.png'
    "
    alt="W3Champions Logo"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-facing-decorator";

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
