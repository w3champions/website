<template>
  <div>
    <v-card-title class="pt-3">Replay Downloads</v-card-title>
    <v-card-subtitle class="pb-1 text-wrap">
      Every finished replay download: who downloaded which games, and with which selection.
    </v-card-subtitle>
    <v-alert
      v-if="store.error"
      type="error"
      variant="tonal"
      density="compact"
      class="mx-4 mt-3"
      closable
      @click:close="store.error = ''"
    >
      {{ store.error }}
    </v-alert>
    <replay-past-downloads all-users />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import ReplayPastDownloads from "@/components/replays/ReplayPastDownloads.vue";
import { useReplayExportStore } from "@/store/admin/replayExport/store";

const store = useReplayExportStore();
// Before the list loads: the admin endpoints, also after a visit to the replay store.
store.setMode("admin");

// The store is shared with the Replay Export page: an error from there does not belong here.
onMounted(() => (store.error = ""));
</script>
