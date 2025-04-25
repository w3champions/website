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
import { defineComponent } from "vue";

export default defineComponent({
  name: "BrandLogo",
  components: {},
  props: {
    isDarkTheme: {
      type: Boolean,
      required: true,
    },
  },
});
</script>

<style scoped>
img {
  max-height: 100%;
  max-width: 100%;
}
</style>
