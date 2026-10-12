<template>
  <admin-storage-files :provider="CloudStorageProvider.ALIBABA" />
</template>

<script setup lang="ts">
import AdminStorageFiles from "./AdminStorageFiles.vue";
import { CloudStorageProvider } from "@/store/admin/cloudStorage/types";
</script>
