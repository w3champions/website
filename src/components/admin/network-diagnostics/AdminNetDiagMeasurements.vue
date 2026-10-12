<template>
  <div>
    <v-card-title class="pt-3 d-flex align-center flex-wrap ga-2">
      <span>Measurements</span>
      <v-spacer />
      <v-btn v-if="battleTag" color="primary" variant="outlined" :prepend-icon="mdiPlus" :to="{ name: EAdminRouteName.NETDIAG_NEW_RUN, query: { battleTag } }">Measure this player</v-btn>
    </v-card-title>

    <v-container>
      <v-row dense align="center">
        <v-col cols="12" md="5">
          <battle-tag-picker v-model="picked" :reset-key="pickerKey" label="Find a player" />
        </v-col>
        <v-col cols="12" md="7" class="d-flex flex-wrap ga-2">
          <v-chip v-if="battleTag" closable @click:close="clearBattleTag">Player: {{ battleTag }}</v-chip>
          <v-chip v-if="runId" closable @click:close="clearRun">Run: {{ runId }}</v-chip>
        </v-col>
      </v-row>
      <v-alert v-if="store.listError" type="error" variant="tonal" density="compact" class="mt-2">Failed to load measurements: {{ store.listError }}</v-alert>
    </v-container>

    <v-data-table-server
      :headers="headers"
      :items="store.measurements"
      :items-length="store.total"
      :items-per-page="itemsPerPage"
      :items-per-page-options="[10, 25, 50, 100]"
      :page="page"
      :loading="store.listLoading"
      :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
      item-value="measurementId"
      :no-data-text="store.listError ? 'Could not load.' : 'No measurements match.'"
      @update:options="onTableOptions"
    >
      <template v-slot:[`item.submittedAt`]="{ item }">{{ formatUtc(item.submittedAt) }}</template>
      <template v-slot:[`item.runId`]="{ item }">
        <router-link :to="{ name: EAdminRouteName.NETDIAG_RUN_DETAIL, params: { runId: item.runId } }">{{ item.runId.slice(0, 8) }}</router-link>
      </template>
      <template v-slot:[`item.clientIp`]="{ item }">{{ textOrDash(item.clientIp) }}</template>
      <template v-slot:[`item.location`]="{ item }">{{ geoText(item.clientGeo) }}</template>
      <template v-slot:[`item.network`]="{ item }">{{ asnText(item.clientGeo?.asn, item.clientGeo?.asnOrg) }}</template>
      <template v-slot:[`item.os`]="{ item }">{{ textOrDash(item.os) }}</template>
      <template v-slot:[`item.primaryAdapterType`]="{ item }">{{ textOrDash(item.primaryAdapterType) }}</template>
      <template v-slot:[`item.vpnSuspected`]="{ item }">{{ item.vpnSuspected == null ? "—" : item.vpnSuspected ? "suspected" : "no" }}</template>
      <template v-slot:[`item.actions`]="{ item }">
        <v-btn
          size="small"
          variant="text"
          color="primary"
          :prepend-icon="mdiEye"
          :to="{ name: EAdminRouteName.NETDIAG_MEASUREMENT_DETAIL, params: { measurementId: item.measurementId } }"
        >
          Open
        </v-btn>
      </template>
    </v-data-table-server>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { DataTableHeader } from "vuetify";
import { mdiEye, mdiPlus } from "@mdi/js";
import BattleTagPicker from "@/components/admin/commercial-events/BattleTagPicker.vue";
import { EAdminRouteName } from "@/router/types";
import { formatUtc } from "@/helpers/utc-dates";
import { useNetDiagMeasurementsStore } from "@/store/admin/networkDiagnostics/measurementsStore";
import type { MeasurementFilters } from "@/store/admin/networkDiagnostics/types";
import { asnText, geoText, textOrDash } from "./format";
import { buildListQuery, type ListPaging, nextTablePage, readListQuery, sameListQuery } from "./listQuery";

const DEFAULT_PAGE_SIZE = 25;
const FILTER_KEYS = ["battleTag", "runId"] as const;

const store = useNetDiagMeasurementsStore();
const route = useRoute();
const router = useRouter();

const headers: DataTableHeader[] = [
  { title: "Submitted", value: "submittedAt", sortable: false, width: "160px" },
  { title: "Player", value: "battleTag", sortable: false },
  { title: "Run", value: "runId", sortable: false },
  { title: "Client IP", value: "clientIp", sortable: false },
  { title: "Location", value: "location", sortable: false },
  { title: "Network", value: "network", sortable: false },
  { title: "OS", value: "os", sortable: false },
  { title: "Adapter", value: "primaryAdapterType", sortable: false },
  { title: "VPN", value: "vpnSuspected", sortable: false },
  { title: "Targets", value: "targetCount", sortable: false, align: "end" },
  { title: "Restarts", value: "restarts", sortable: false, align: "end" },
  { title: "Actions", value: "actions", sortable: false, width: "100px", align: "center" },
];

const initial = readListQuery(route.query, FILTER_KEYS, DEFAULT_PAGE_SIZE);
const battleTag = ref(initial.filters.battleTag);
const runId = ref(initial.filters.runId);
const picked = ref("");
const pickerKey = ref(0);
const page = ref(initial.page);
const itemsPerPage = ref(initial.itemsPerPage);

function syncRoute(): void {
  router.replace({
    name: EAdminRouteName.NETDIAG_MEASUREMENTS,
    query: buildListQuery({ battleTag: battleTag.value, runId: runId.value }, page.value, itemsPerPage.value, DEFAULT_PAGE_SIZE),
  });
}

async function load(): Promise<void> {
  const filters: MeasurementFilters = { battleTag: battleTag.value || undefined, runIds: runId.value ? [runId.value] : undefined };
  await store.loadMeasurements(filters, page.value - 1, itemsPerPage.value);
}

function applyFilters(): void {
  page.value = 1;
  syncRoute();
  load();
}

function setBattleTag(tag: string): void {
  battleTag.value = tag;
  applyFilters();
}

function clearBattleTag(): void {
  picked.value = "";
  pickerKey.value += 1;
  setBattleTag("");
}

function clearRun(): void {
  runId.value = "";
  applyFilters();
}

function onTableOptions(options: ListPaging): void {
  const next = nextTablePage(options, { page: page.value, itemsPerPage: itemsPerPage.value }, DEFAULT_PAGE_SIZE);
  if (next === null) return;
  page.value = next.page;
  itemsPerPage.value = next.itemsPerPage;
  syncRoute();
  load();
}

// A picked search result is an exact BattleTag (BattleTagPicker never passes typed text through).
watch(picked, (tag) => {
  if (tag !== "") setBattleTag(tag);
});

// Links from other pages reuse this component with a new query. Leaving the page also changes
// `route.query`; only react while this route is still the current one.
watch(() => route.query, (query) => {
  if (route.name !== EAdminRouteName.NETDIAG_MEASUREMENTS) return;
  const next = readListQuery(query, FILTER_KEYS, DEFAULT_PAGE_SIZE);
  const current = { filters: { battleTag: battleTag.value, runId: runId.value }, page: page.value, itemsPerPage: itemsPerPage.value };
  if (sameListQuery(next, current)) return;
  battleTag.value = next.filters.battleTag;
  runId.value = next.filters.runId;
  page.value = next.page;
  itemsPerPage.value = next.itemsPerPage;
  load();
});

onMounted(load);
</script>
