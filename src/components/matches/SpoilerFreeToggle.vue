<template>
  <div v-if="!unfinished">
    <v-menu location="bottom end" transition="fade-transition" :close-on-content-click="false">
      <template v-slot:activator="{ props }">
        <v-tooltip location="top" content-class="w3-tooltip elevation-1" transition="none">
          <template v-slot:activator="{ props: tooltipProps }">
            <v-btn
              icon
              tile
              density="comfortable"
              class="w3-dropdown-button"
              style="background-color: transparent"
              v-bind="{ ...props, ...tooltipProps }"
            >
              <v-icon>{{ mdiHistory }}</v-icon>
            </v-btn>
          </template>
          <span>{{ $t("components_matches_spoilerfreetoggle.title") }}</span>
        </v-tooltip>
      </template>

      <v-card min-width="260">
        <v-card-text class="pb-2">
          <div class="text-subtitle-2 mb-2">{{ $t("components_matches_spoilerfreetoggle.title") }}</div>
          <v-switch
            :model-value="hideWinner"
            hide-details
            density="compact"
            color="primary"
            class="ml-2"
            :label="$t('components_matches_spoilerfreetoggle.winner')"
            @update:model-value="onWinnerChanged"
          />
          <v-switch
            :model-value="hideDuration"
            hide-details
            density="compact"
            color="primary"
            class="ml-2"
            :label="$t('components_matches_spoilerfreetoggle.duration')"
            @update:model-value="onDurationChanged"
          />
        </v-card-text>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { mdiHistory } from "@mdi/js";
import { useSpoilerFreeStore } from "@/store/spoilerFree/store";

defineProps<{
  unfinished?: boolean;
}>();

const spoilerFreeStore = useSpoilerFreeStore();

const hideWinner = computed<boolean>(() => spoilerFreeStore.hideWinner);
const hideDuration = computed<boolean>(() => spoilerFreeStore.hideDuration);

function onWinnerChanged(value: boolean | null): void {
  if (value !== null) {
    spoilerFreeStore.setHideWinner(value);
  }
}

function onDurationChanged(value: boolean | null): void {
  if (value !== null) {
    spoilerFreeStore.setHideDuration(value);
  }
}
</script>
