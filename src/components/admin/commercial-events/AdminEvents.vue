<template>
  <div>
    <v-card-title class="pt-3">
      Events
    </v-card-title>
    <v-container v-if="permissionsKnown && !hasPermission" class="w3-container-width">
      <v-alert type="warning" variant="tonal">
        You don't have the CommercialLicense permission.
      </v-alert>
    </v-container>
    <v-container v-else-if="hasPermission" class="w3-container-width">
      <v-alert v-if="store.loadError" type="error" variant="tonal" class="mb-4">
        {{ store.loadError }}
        <template v-slot:append>
          <v-btn variant="text" :disabled="store.loading" @click="store.load()">Retry</v-btn>
        </template>
      </v-alert>
      <v-alert v-if="allocationsStore.loadError" type="warning" variant="tonal" density="compact" class="mb-4">
        Allocations couldn't be loaded: {{ allocationsStore.loadError }}
      </v-alert>

      <v-row dense>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="store.filters.status"
            label="Status"
            :items="STATUS_FILTER_OPTIONS"
            item-title="title"
            item-value="value"
            variant="underlined"
            color="primary"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="store.filters.phase"
            label="Phase (open events)"
            :items="PHASE_FILTER_OPTIONS"
            item-title="title"
            item-value="value"
            :disabled="!phaseApplies"
            variant="underlined"
            color="primary"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="store.filters.allocationId"
            label="Allocation"
            :items="allocationItems"
            item-title="title"
            item-value="value"
            variant="underlined"
            color="primary"
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-text-field
            v-model="store.filters.q"
            label="Search name or ID"
            :prepend-inner-icon="mdiMagnify"
            clearable
            variant="underlined"
            color="primary"
            hide-details
            @click:clear="store.filters.q = ''"
          />
        </v-col>
      </v-row>

      <v-data-table
        class="mt-4"
        :headers="headers"
        :items="store.events"
        :loading="store.loading || store.saving"
        :items-per-page="25"
        :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
        item-value="id"
        no-data-text="No events match the filters."
      >
        <template v-slot:top>
          <div class="d-flex align-center px-4">
            <v-spacer />
            <v-btn variant="text" class="mb-2" :prepend-icon="mdiRefresh" :disabled="store.loading" @click="store.load()">
              Refresh
            </v-btn>
          </div>
        </template>

        <template v-slot:[`item.name`]="{ item }">
          {{ item.name }}
        </template>

        <template v-slot:[`item.kind`]="{ item }">
          {{ kindLabel(item.kind) }}
        </template>

        <template v-slot:[`item.prizePoolUsd`]="{ item }">
          {{ formatPrizePool(item.prizePoolUsd) }}
        </template>

        <template v-slot:[`item.startsAt`]="{ item }">
          {{ formatUtc(item.startsAt) }}
        </template>

        <template v-slot:[`item.endsAt`]="{ item }">
          {{ formatUtc(item.endsAt) }}
        </template>

        <template v-slot:[`item.used`]="{ item }">
          {{ eventUsedLabel(item) }}
        </template>

        <template v-slot:[`item.status`]="{ item }">
          <v-chip size="small" variant="flat" :color="eventStatusColor(item)">{{ eventStatusLabel(item) }}</v-chip>
        </template>
      </v-data-table>
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, watch } from "vue";
import { mdiMagnify, mdiRefresh } from "@mdi/js";
import debounce from "debounce";
import type { DataTableHeader } from "vuetify";
import { useCommercialLicensePermission } from "@/composables/useCommercialLicensePermission";
import { useCommercialEventAllocationsStore } from "@/store/admin/commercialEvents/allocationsStore";
import { formatUtc } from "@/store/admin/commercialEvents/dates";
import { useCommercialEventsStore } from "@/store/admin/commercialEvents/eventsStore";
import {
  allocationOptionLabel,
  eventStatusColor,
  eventStatusLabel,
  eventUsedLabel,
  formatPrizePool,
  kindLabel,
  PHASE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "@/store/admin/commercialEvents/format";

const SEARCH_DELAY = 500;

const store = useCommercialEventsStore();
const allocationsStore = useCommercialEventAllocationsStore();
const { hasPermission, permissionsKnown } = useCommercialLicensePermission();

const headers: DataTableHeader[] = [
  { title: "Name", value: "name", sortable: true },
  { title: "ID", value: "id", sortable: false },
  { title: "Type", value: "kind", sortable: true },
  { title: "Prize pool", value: "prizePoolUsd", sortable: true },
  { title: "Start (UTC)", value: "startsAt", sortable: true },
  { title: "End (UTC)", value: "endsAt", sortable: true },
  { title: "Allocation", value: "allocationName", sortable: true },
  { title: "Used / limit", value: "used", sortable: false },
  { title: "In progress", value: "held", sortable: true },
  { title: "Not counted", value: "invalid", sortable: true },
  { title: "Status", value: "status", sortable: true },
];

/** Phase only narrows open events. */
const phaseApplies = computed(() => store.filters.status === "" || store.filters.status === "open");

const allocationItems = computed(() => [
  { title: "All allocations", value: "" },
  ...allocationsStore.allocations.map((a) => ({ title: allocationOptionLabel(a), value: a.id })),
]);

const debouncedLoad = debounce(() => void store.load(), SEARCH_DELAY);

watch(
  () => [store.filters.status, store.filters.phase, store.filters.allocationId] as const,
  () => {
    if (!phaseApplies.value && store.filters.phase !== "") {
      store.filters.phase = ""; // re-triggers this watcher, which then loads
      return;
    }
    debouncedLoad.clear();
    void store.load();
  },
);
watch(() => store.filters.q, () => debouncedLoad());

async function init(): Promise<void> {
  if (!hasPermission.value) {
    debouncedLoad.clear();
    store.$reset();
    return;
  }
  await Promise.all([store.load(), allocationsStore.load()]);
}

watch(hasPermission, init);
onMounted(init);
onBeforeUnmount(() => debouncedLoad.clear());
</script>
