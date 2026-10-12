<template>
  <v-container class="pa-3 w3-container-width">
    <v-row>
      <v-col cols="12">
        <v-card tile class="pb-2">
          <replay-export-page v-if="hasAccess" mode="store" />
          <div v-else-if="checking" class="d-flex justify-center pa-12">
            <v-progress-circular indeterminate />
          </div>
          <v-card-text v-else class="pa-4">
            <h1 class="text-h5 mb-4">Replays</h1>
            <v-alert v-if="profileMissing" type="warning" variant="tonal" density="compact">
              Your account did not load. Reload the page to try again.
            </v-alert>
            <v-alert v-else type="info" variant="tonal" density="compact">This page is not open yet.</v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import ReplayExportPage from "@/components/replays/ReplayExportPage.vue";
import { useReplayStoreAccess } from "@/composables/useReplayStoreAccess";

defineOptions({ name: "ReplaysView" });

const { hasAccess, checking, profileMissing } = useReplayStoreAccess();
</script>
