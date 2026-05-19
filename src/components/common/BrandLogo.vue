<template>
  <img
    :src="isDarkTheme ? '/assets/logos/small-logo-full.png' : '/assets/logos/small-logo-full-black.png'"
    alt="W3Champions Logo"
    class="w3-brand-logo"
  />
</template>

<script setup lang="ts">
defineProps<{
  isDarkTheme: boolean;
}>();
</script>

<style lang="scss" scoped>
.w3-brand-logo {
  max-height: 100%;
  max-width: 100%;
  display: block;
  // Subtle drop shadow so the logo reads well over the parchment
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.18));
  transition: filter 0.2s ease;

  &:hover {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.28));
  }
}
</style>
