<template>
  <div>
    <v-card-title class="pt-3">
      Allocations
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
      <v-alert v-if="store.error" type="error" variant="tonal" class="mb-4" closable @click:close="store.error = ''">
        {{ store.error }}
      </v-alert>

      <v-data-table
        v-model:expanded="expanded"
        :headers="headers"
        :items="store.allocations"
        :loading="store.loading || store.saving"
        :items-per-page="25"
        :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
        item-value="id"
        show-expand
        no-data-text="No allocations."
      >
        <template v-slot:top>
          <div class="d-flex align-center px-4">
            <v-spacer />
            <v-btn variant="text" class="mb-2" :prepend-icon="mdiRefresh" :disabled="store.loading" @click="store.load()">
              Refresh
            </v-btn>
          </div>
        </template>

        <template v-slot:[`item.members`]="{ item }">
          <span :title="memberSummary(item.members, item.members.length)">{{ memberSummary(item.members) }}</span>
        </template>

        <template v-slot:[`item.recurrence`]="{ item }">
          {{ recurrenceLabel(item.recurrence) }}
        </template>

        <template v-slot:[`item.startsAt`]="{ item }">
          {{ formatUtc(item.startsAt) }}
        </template>

        <template v-slot:[`item.endsAt`]="{ item }">
          {{ formatUtc(item.endsAt) }}
        </template>

        <template v-slot:[`item.allowEventCreation`]="{ item }">
          <v-icon size="small">{{ item.allowEventCreation ? mdiCheck : mdiClose }}</v-icon>
        </template>

        <template v-slot:[`item.currentPeriod`]="{ item }">
          {{ periodUsageLabel(item.currentPeriod) }}
          <v-chip v-if="item.currentPeriod && item.currentPeriod.warning === 'empty'" class="ml-1" size="small" variant="flat" color="error">
            No games left
          </v-chip>
        </template>

        <template v-slot:[`item.state`]="{ item }">
          {{ allocationStateLabel(item.state) }}
        </template>

        <template v-slot:[`item.actions`]="{ item }">
          <v-btn
            icon
            variant="text"
            size="small"
            title="End now"
            :aria-label="`End ${item.name} now`"
            :disabled="store.saving || item.state !== 'active'"
            @click="endNow(item)"
          >
            <v-icon size="small">{{ mdiStop }}</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="small"
            :title="hasRecordedUsage(item) ? 'Used allocations can only be ended' : 'Delete'"
            :aria-label="`Delete ${item.name}`"
            :disabled="store.saving || hasRecordedUsage(item)"
            @click="removeItem(item)"
          >
            <v-icon size="small">{{ mdiDelete }}</v-icon>
          </v-btn>
        </template>

        <template v-slot:expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length" class="py-2">
              <allocation-details :allocation-id="item.id" />
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import { mdiCheck, mdiClose, mdiDelete, mdiRefresh, mdiStop } from "@mdi/js";
import type { DataTableHeader } from "vuetify";
import AllocationDetails from "@/components/admin/commercial-events/AllocationDetails.vue";
import { useCommercialLicensePermission } from "@/composables/useCommercialLicensePermission";
import { useCommercialEventAllocationsStore } from "@/store/admin/commercialEvents/allocationsStore";
import { hasRecordedUsage } from "@/store/admin/commercialEvents/allocationDraft";
import { formatUtc } from "@/store/admin/commercialEvents/dates";
import { allocationStateLabel, memberSummary, periodUsageLabel, recurrenceLabel } from "@/store/admin/commercialEvents/format";
import type { Allocation } from "@/store/admin/commercialEvents/types";

const store = useCommercialEventAllocationsStore();
const { hasPermission, permissionsKnown } = useCommercialLicensePermission();

const expanded = ref<string[]>([]);

const headers: DataTableHeader[] = [
  { title: "Name", value: "name", sortable: true },
  { title: "Members", value: "members", sortable: false },
  { title: "Games per period", value: "gamesPerPeriod", sortable: true },
  { title: "Recurrence", value: "recurrence", sortable: true },
  { title: "Start", value: "startsAt", sortable: true },
  { title: "End", value: "endsAt", sortable: true },
  { title: "Allows creating events", value: "allowEventCreation", sortable: true },
  { title: "Current period (used / size)", value: "currentPeriod", sortable: false },
  { title: "State", value: "state", sortable: true },
  { title: "Actions", value: "actions", sortable: false, align: "center" },
];

async function endNow(allocation: Allocation): Promise<void> {
  if (confirm(`End "${allocation.name}" now? Members can no longer start event games from it, and its events become read-only for organizers.`)) {
    await store.end(allocation.id);
  }
}

async function removeItem(allocation: Allocation): Promise<void> {
  if (confirm(`Delete "${allocation.name}"? This only works while it has never been used.`)) {
    await store.remove(allocation.id);
  }
}

async function init(): Promise<void> {
  if (!hasPermission.value) {
    store.$reset();
    return;
  }
  await store.load();
}

watch(hasPermission, init);
onMounted(init);
</script>
