<template>
  <div class="page-hero">
    <p v-if="eyebrow" class="page-hero__eyebrow">{{ eyebrow }}</p>
    <h1 class="page-hero__title">{{ title }}</h1>
    <p v-if="subtitle" class="page-hero__subtitle">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  eyebrow?: string;
  subtitle?: string;
}>();
</script>

<style lang="scss" scoped>
.page-hero {
  padding: 36px 32px 28px;
  text-align: center;

  &__eyebrow {
    font-family: var(--w3-font-ui);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgb(var(--v-theme-w3-gold));
    opacity: 0.8;
    margin: 0 0 10px;
  }

  &__title {
    font-family: var(--w3-font-heading);
    font-size: clamp(1.8rem, 3.5vw, 3rem);
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: rgb(var(--v-theme-w3-gold));
    margin: 0 0 10px;
    line-height: 1.1;

    // Metallic rules on both sides
    display: flex;
    align-items: center;
    gap: 20px;

    &::before, &::after {
      content: "";
      flex: 1;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent,
        rgb(var(--v-theme-w3-gold)),
        transparent
      );
      opacity: 0.4;
    }
  }

  &__subtitle {
    font-family: var(--w3-font-body);
    font-size: 1.15rem;
    font-style: italic;
    margin: 0;
    opacity: 0.7;
  }
}

// Dark themes — add subtle text glow
.v-theme--undead, .v-theme--nightelf {
  .page-hero__title {
    text-shadow: 0 0 24px rgb(var(--v-theme-w3-gold) / 0.3);
  }
}
</style>
