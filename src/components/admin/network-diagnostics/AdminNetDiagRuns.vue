<template>
  <div>
    <v-card-title class="pt-3 d-flex align-center flex-wrap ga-2">
      <span>Remote Measurements</span>
      <v-spacer />
      <v-btn color="primary" :prepend-icon="mdiPlus" :to="{ name: EAdminRouteName.NETDIAG_NEW_RUN }">New measurement</v-btn>
    </v-card-title>

    <v-container v-if="store.runsError" class="pb-0">
      <v-alert type="error" variant="tonal" density="compact">Failed to load runs: {{ store.runsError }}</v-alert>
    </v-container>

    <v-container>
      <v-row dense>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="filters.createdBy"
            label="Created by (exact BattleTag)"
            variant="underlined"
            color="primary"
            clearable
            @update:modelValue="onFilterChange"
          />
        </v-col>
        <v-col cols="6" md="3">
          <v-text-field
            v-model="filters.from"
            label="From (UTC)"
            type="date"
            variant="underlined"
            color="primary"
            clearable
            @update:modelValue="onFilterChange"
          />
        </v-col>
        <v-col cols="6" md="3">
          <v-text-field
            v-model="filters.to"
            label="To (UTC)"
            type="date"
            variant="underlined"
            color="primary"
            clearable
            @update:modelValue="onFilterChange"
          />
        </v-col>
        <v-col cols="12" md="2" class="d-flex align-center">
          <v-btn color="primary" variant="outlined" block @click="load">Refresh</v-btn>
        </v-col>
      </v-row>
    </v-container>

    <v-data-table-server
      :headers="headers"
      :items="store.runs"
      :items-length="store.total"
      :items-per-page="itemsPerPage"
      :items-per-page-options="[10, 25, 50]"
      :page="page"
      :loading="store.runsLoading"
      :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
      item-value="id"
      @update:options="onTableOptions"
    >
      <template v-slot:[`item.createdAt`]="{ item }">{{ formatUtc(item.createdAt) }}</template>
      <template v-slot:[`item.audience`]="{ item }">{{ audienceSummary(item.audience) }}</template>
      <template v-slot:[`item.targets`]="{ item }">{{ targetsSummary(item.targets) }}</template>
      <template v-slot:[`item.methods`]="{ item }">
        <span class="text-caption">{{ item.methods.join(", ") }}</span>
      </template>
      <template v-slot:[`item.progress`]="{ item }">
        <span class="text-caption">{{ progressText(item.counters) }}</span>
      </template>
      <template v-slot:[`item.status`]="{ item }">
        <v-chip size="small" variant="tonal" :color="RUN_STATUS_COLOR[runStatus(item, now)]">{{ runStatus(item, now) }}</v-chip>
      </template>
    </v-data-table-server>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import debounce from "debounce";
import { mdiPlus } from "@mdi/js";
import type { DataTableHeader } from "vuetify";
import { EAdminRouteName } from "@/router/types";
import { formatUtc } from "@/helpers/utc-dates";
import { useNetDiagRunsStore } from "@/store/admin/networkDiagnostics/runsStore";
import { buildListQuery, type ListPaging, nextTablePage, readListQuery } from "./listQuery";
import { audienceSummary, progressText, RUN_STATUS_COLOR, runStatus, targetsSummary, utcDateRangeToIso } from "./format";

const DEFAULT_PAGE_SIZE = 25;
const FILTER_DEBOUNCE_MS = 400;

const store = useNetDiagRunsStore();
const route = useRoute();
const router = useRouter();
const now = ref(new Date());

const headers: DataTableHeader[] = [
  { title: "Created", value: "createdAt", sortable: false, width: "160px" },
  { title: "By", value: "createdBy", sortable: false },
  { title: "Audience", value: "audience", sortable: false },
  { title: "Targets", value: "targets", sortable: false },
  { title: "Methods", value: "methods", sortable: false },
  { title: "Progress", value: "progress", sortable: false },
  { title: "Status", value: "status", sortable: false, width: "140px" },
];

const FILTER_KEYS = ["createdBy", "from", "to"] as const;

const initial = readListQuery(route.query, FILTER_KEYS, DEFAULT_PAGE_SIZE);
// Clearable fields set null.
const filters = reactive<{ createdBy: string | null; from: string | null; to: string | null }>({ ...initial.filters });
const page = ref(initial.page);
const itemsPerPage = ref(initial.itemsPerPage);

function syncRoute(): void {
  router.replace({ name: EAdminRouteName.NETDIAG_RUNS, query: buildListQuery(filters, page.value, itemsPerPage.value, DEFAULT_PAGE_SIZE) });
}

async function load(): Promise<void> {
  now.value = new Date();
  const range = utcDateRangeToIso(filters.from ?? "", filters.to ?? "");
  await store.loadRuns({
    createdBy: filters.createdBy?.trim() || undefined,
    from: range.from,
    to: range.to,
    page: page.value - 1,
    pageSize: itemsPerPage.value,
  });
}

const debouncedLoad = debounce(load, FILTER_DEBOUNCE_MS);

function onFilterChange(): void {
  page.value = 1;
  syncRoute();
  debouncedLoad();
}

function onTableOptions(options: ListPaging): void {
  const next = nextTablePage(options, { page: page.value, itemsPerPage: itemsPerPage.value }, DEFAULT_PAGE_SIZE);
  if (next === null) return;
  page.value = next.page;
  itemsPerPage.value = next.itemsPerPage;
  syncRoute();
  load();
}

onMounted(load);
onBeforeUnmount(() => debouncedLoad.clear());
</script>
