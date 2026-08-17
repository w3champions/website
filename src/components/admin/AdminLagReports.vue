<template>
  <div>
    <v-card-title class="pt-3">
      Lag Reports
    </v-card-title>

    <v-container v-if="reportsError" fluid class="pb-0">
      <v-alert type="error" variant="tonal" density="compact">
        Failed to load lag reports: {{ reportsError }}
      </v-alert>
    </v-container>

    <!-- fluid throughout the card: the plain container caps its width and
         centres itself on wide screens, which would indent the filter bar away
         from the full-bleed title and table. -->
    <v-container fluid>
      <div class="d-flex align-center flex-wrap ga-2">
        <!-- Filters and view controls are two groups, not one long run of
             items: the controls stay intact and drop to their own line as a
             block, instead of the row breaking wherever the chips happen to
             run out of width. -->
        <lag-report-filter-bar @change="onFilterChange" />

        <div class="d-flex align-center ga-2 ms-auto">
          <v-btn-toggle v-model="explicitMode" mandatory density="compact" variant="outlined" divided>
            <v-btn value="all" size="small" title="Every report, including the ones flo raised on its own">
              All
            </v-btn>
            <v-btn value="submitted" size="small" title="Only reports where a player filled in the in-game dialog">
              Submitted
            </v-btn>
          </v-btn-toggle>

          <v-btn :icon="mdiRefresh" size="small" variant="text" title="Refresh results" @click="refreshResults" />
        </div>
      </div>
    </v-container>

    <v-data-table-server
      :headers="headers"
      :items="tableItems"
      :items-length="tableTotal"
      :items-per-page="tableOptions.itemsPerPage"
      :items-per-page-options="[10, 25, 50]"
      :page="tableOptions.page"
      :loading="tableLoading"
      :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
      item-value="id"
      @update:options="onTableOptionsUpdate"
    >
      <template v-slot:[`item.createdAt`]="{ item }">
        {{ formatDate(item.createdAt) }}
      </template>
      <template v-slot:[`item.hasExplicitReport`]="{ item }">
        <v-icon :color="item.hasExplicitReport ? 'success' : 'grey'" size="small">
          {{ item.hasExplicitReport ? mdiCheckCircle : mdiCloseCircle }}
        </v-icon>
      </template>
      <template v-slot:[`item.players`]="{ item }">
        <div v-for="(p, i) in item.players" :key="i" class="d-flex align-center ga-1 my-1">
          <span class="text-body-2">{{ p.battleTag }}</span>
          <v-chip v-if="p.isExplicit" size="x-small" color="warning" variant="tonal">explicit</v-chip>
          <v-chip v-if="p.connectionType === 'Proxied'" size="x-small" color="info" variant="tonal">
            proxied{{ p.proxyName ? `: ${p.proxyName}` : '' }}
          </v-chip>
          <v-chip
            v-for="(cat, ci) in p.issueCategories"
            :key="ci"
            size="x-small"
            color="error"
            variant="tonal"
          >
            {{ cat }}
          </v-chip>
        </div>
      </template>
      <template v-slot:[`item.actions`]="{ item }">
        <v-btn
          size="small"
          variant="text"
          color="primary"
          :prepend-icon="mdiEye"
          @click="openDetail(item.id)"
        >
          Detail
        </v-btn>
      </template>
      <template v-slot:no-data>
        <div class="py-4 text-medium-emphasis">{{ emptyWindowNote }}</div>
      </template>
    </v-data-table-server>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { mdiCheckCircle, mdiCloseCircle, mdiEye, mdiRefresh } from "@mdi/js";
import debounce from "debounce";
import { DataTableHeader } from "vuetify";
import { EAdminRouteName } from "@/router/types";
import { useLagReportsStore } from "@/store/admin/lagReports/store";
import {
  applyDefaultWindow,
  applyQueryToFilters,
  FiltersQueryRecord,
  filterParams,
  filtersToQuery,
  queryHoldsFilterState,
  RETENTION_DAYS,
  useLagReportsFiltersStore,
} from "@/store/admin/lagReports/filters";
import { LagReportQueryParams } from "@/store/admin/lagReports/types";
import LagReportFilterBar from "@/components/admin/lag-reports/filter-bar/LagReportFilterBar.vue";

type VuetifyTableUpdateOptions = {
  page: number;
  itemsPerPage: number;
  sortBy: Array<{ key: string; order: string }>;
  groupBy: Array<string>;
  search: string;
};

// What one visit leaves for the next: the filters as the same query-shaped
// record the URL carries (one serialization, two homes) plus the view shape.
type LagReportsUiState = {
  filters: FiltersQueryRecord;
  tableOptions: {
    page: number;
    itemsPerPage: number;
  };
};

const LAG_REPORTS_UI_STATE_KEY = "admin-lag-reports-ui-state";

export default defineComponent({
  name: "AdminLagReports",
  components: { LagReportFilterBar },
  setup() {
    const lagReportsStore = useLagReportsStore();
    const filtersStore = useLagReportsFiltersStore();
    const router = useRouter();
    const route = useRoute();

    const reportsError = computed(() => lagReportsStore.reportsError);

    const tableOptions = ref({
      page: 1,
      itemsPerPage: 25,
    });

    const headers: DataTableHeader[] = [
      { title: "Created", value: "createdAt", sortable: false, width: "140px" },
      { title: "Flo Game", value: "floGameId", sortable: false, width: "100px" },
      { title: "Game", value: "gameName", sortable: false },
      { title: "Server", value: "serverNodeName", sortable: false, width: "120px" },
      { title: "Explicit", value: "hasExplicitReport", sortable: false, width: "80px", align: "center" },
      { title: "Players", value: "players", sortable: false },
      { title: "", value: "actions", sortable: false, width: "100px", align: "center" },
    ];

    // Every filter runs on the server against the full window, so the table
    // reads straight from the store — there is no second row universe.
    const tableItems = computed(() => lagReportsStore.reports);
    const tableTotal = computed(() => lagReportsStore.total);
    const tableLoading = computed(() => lagReportsStore.loading);

    // Shown wherever a filtered view comes up empty: an empty result inside a
    // two-day default window is not "no data exists" — say which window was
    // searched and how to widen it.
    const emptyWindowNote = computed(() =>
      `No reports match between ${filtersStore.dateFrom} and ${filtersStore.dateTo} (UTC). Widen the date range to search older reports — up to ${RETENTION_DAYS} days are retained.`
    );

    // ── Server-backed flat list ──────────────────────────────────────

    function buildParams(): LagReportQueryParams {
      return {
        page: tableOptions.value.page - 1,
        pageSize: tableOptions.value.itemsPerPage,
        ...filterParams(filtersStore),
      };
    }

    async function loadReports() {
      await lagReportsStore.loadReports(buildParams());
    }

    function routeQueryFromState(): Record<string, string> {
      const query = filtersToQuery(filtersStore);
      if (tableOptions.value.page !== 1) query.page = String(tableOptions.value.page);
      if (tableOptions.value.itemsPerPage !== 25) query.itemsPerPage = String(tableOptions.value.itemsPerPage);
      return query;
    }

    function syncRouteQuery() {
      router.replace({ name: EAdminRouteName.LAG_REPORTS, query: routeQueryFromState() });
    }

    function persistUiState() {
      if (typeof window === "undefined") return;

      const state: LagReportsUiState = {
        filters: filtersToQuery(filtersStore),
        tableOptions: {
          page: tableOptions.value.page,
          itemsPerPage: tableOptions.value.itemsPerPage,
        },
      };

      window.sessionStorage.setItem(LAG_REPORTS_UI_STATE_KEY, JSON.stringify(state));
    }

    function readStoredUiState(): LagReportsUiState | null {
      if (typeof window === "undefined") return null;

      const raw = window.sessionStorage.getItem(LAG_REPORTS_UI_STATE_KEY);
      if (!raw) return null;

      try {
        const state = JSON.parse(raw) as LagReportsUiState;
        // Snapshots from the previous storage shape held structured values
        // (arrays, booleans); the query-shaped record is strings only. Drop an
        // old filters record rather than half-reading it — the view shape
        // fields below kept their form and still apply.
        if (state.filters && Object.values(state.filters).some((value) => typeof value !== "string")) {
          state.filters = {};
        }
        return state;
      } catch (_error) {
        window.sessionStorage.removeItem(LAG_REPORTS_UI_STATE_KEY);
        return null;
      }
    }

    function applyStoredUiState(state: LagReportsUiState) {
      applyQueryToFilters(filtersStore, state.filters ?? {});

      tableOptions.value.page = state.tableOptions?.page && state.tableOptions.page > 0 ? state.tableOptions.page : 1;
      tableOptions.value.itemsPerPage =
        state.tableOptions?.itemsPerPage && state.tableOptions.itemsPerPage > 0 ? state.tableOptions.itemsPerPage : 25;
    }

    function hydrateStateFromQuery() {
      // The filters store outlives the component between visits; every entry
      // starts from the defaults before the URL, storage or the offer speak.
      filtersStore.$reset();

      const hasQueryState = queryHoldsFilterState(route.query)
        || typeof route.query.page === "string"
        || typeof route.query.itemsPerPage === "string";

      if (!hasQueryState) {
        const stored = readStoredUiState();
        if (stored) applyStoredUiState(stored);
        return;
      }

      applyQueryToFilters(filtersStore, route.query);

      const page = typeof route.query.page === "string" ? Number(route.query.page) : NaN;
      tableOptions.value.page = Number.isFinite(page) && page > 0 ? page : 1;

      const itemsPerPage = typeof route.query.itemsPerPage === "string" ? Number(route.query.itemsPerPage) : NaN;
      tableOptions.value.itemsPerPage = Number.isFinite(itemsPerPage) && itemsPerPage > 0 ? itemsPerPage : 25;
    }

    hydrateStateFromQuery();

    const debouncedLoad = debounce(loadReports, 400);

    function onFilterChange() {
      tableOptions.value.page = 1;
      persistUiState();
      syncRouteQuery();
      debouncedLoad();
    }

    function onTableOptionsUpdate(options: VuetifyTableUpdateOptions) {
      const nextPage = options.page > 0 ? options.page : 1;
      const nextItemsPerPage = options.itemsPerPage > 0 ? options.itemsPerPage : 25;
      const optionsChanged =
        tableOptions.value.page !== nextPage || tableOptions.value.itemsPerPage !== nextItemsPerPage;

      if (!optionsChanged) {
        return;
      }

      tableOptions.value.page = nextPage;
      tableOptions.value.itemsPerPage = nextItemsPerPage;
      persistUiState();
      syncRouteQuery();
      loadReports();
    }

    function refreshResults() {
      // A defaulted window tracks "now": re-derive it, so a tab left open
      // across UTC midnight refreshes into the current today+yesterday.
      if (!filtersStore.datesExplicit) applyDefaultWindow(filtersStore);
      persistUiState();
      syncRouteQuery();
      loadReports();
    }

    // "Submitted" means at least one player filled in the in-game report
    // dialog; the rest are reports flo raised on its own. This is the same
    // state as the explicit filter, shown as a segmented control because it is
    // the one filter people flip constantly while triaging.
    const explicitMode = computed({
      get: () => (filtersStore.explicitOnly ? "submitted" : "all"),
      set: (mode: string) => {
        filtersStore.explicitOnly = mode === "submitted";
        onFilterChange();
      },
    });

    function openDetail(id: string) {
      persistUiState();
      router.push({ name: EAdminRouteName.LAG_REPORT_DETAIL, params: { id }, query: routeQueryFromState() });
    }

    function formatDate(iso: string): string {
      if (!iso) return "";
      const d = new Date(iso);
      return d.toLocaleString();
    }

    onMounted(() => {
      persistUiState();
      syncRouteQuery();
      loadReports();
    });

    return {
      filtersStore,
      reportsError,
      tableOptions,
      headers,
      tableItems,
      tableTotal,
      tableLoading,
      emptyWindowNote,
      onFilterChange,
      onTableOptionsUpdate,
      refreshResults,
      explicitMode,
      openDetail,
      formatDate,
      mdiCheckCircle,
      mdiCloseCircle,
      mdiEye,
      mdiRefresh,
    };
  },
});
</script>
