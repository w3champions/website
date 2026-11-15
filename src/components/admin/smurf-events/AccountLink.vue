<template>
  <router-link :to="hardwareLink(battleTag)" class="account-link">{{ battleTag }}</router-link>
</template>

<script lang="ts" setup>
import { hardwareLink } from "@/store/admin/smurfEvents/presence";

defineProps<{
  battleTag: string;
}>();
</script>

<style scoped>
.account-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.account-link:hover {
  text-decoration: underline;
}

.account-link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>
