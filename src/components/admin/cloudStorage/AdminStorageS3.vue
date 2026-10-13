<template>
  <admin-storage-files :provider="CloudStorageProvider.S3" />
</template>

<script setup lang="ts">
import AdminStorageFiles from "./AdminStorageFiles.vue";
import { CloudStorageProvider } from "@/store/admin/cloudStorage/types";
</script>
