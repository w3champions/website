<template>
  <span class="netdiag-cut" :title="text">{{ text }}</span>
</template>

<script lang="ts" setup>
// Real ASN and city names are long; clamp them to two lines so they cannot stretch a table, and put the full text in a title.
defineProps<{ text: string }>();
</script>

<style scoped>
.netdiag-cut {
  /* Wrap and clamp instead of nowrap: a nowrap cell cannot shrink, so a few long names would push the table's last columns off-screen. */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  max-width: 14rem;
  overflow: hidden;
  overflow-wrap: anywhere;
}
</style>
