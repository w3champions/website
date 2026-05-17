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

<script setup lang="ts">
defineProps<{
  isDarkTheme: boolean;
}>();
</script>

<style lang="scss" scoped>
img {
  max-height: 100%;
  max-width: 100%;
}
</style>
