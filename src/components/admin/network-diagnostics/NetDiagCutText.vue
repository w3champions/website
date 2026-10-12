<template>
  <span class="netdiag-cut" :title="text">{{ text }}</span>
</template>

<script lang="ts" setup>
// Real ASN and city names are long; keep them from stretching a table and put the full text in a title.
defineProps<{ text: string }>();
</script>

<style scoped>
.netdiag-cut {
  display: inline-block;
  max-width: 14rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
</style>
