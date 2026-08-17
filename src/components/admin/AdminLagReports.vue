<template>
  <div>
    <v-card-title class="pt-3 d-flex align-center flex-wrap ga-2 lag-reports-title">
      <span>Lag Reports</span>
      <v-spacer />
      <!-- Jump straight to a report someone quoted in a ticket or on Discord,
           without hunting for it in the list. -->
      <div class="d-flex align-center ga-2 open-by-id">
        <v-text-field
          v-model="openIdInput"
          label="Open report by ID"
          placeholder="Report ID or a link to it"
          density="compact"
          variant="outlined"
          hide-details
          @keyup.enter="openById"
        />
        <v-btn
          color="primary"
          variant="tonal"
          :prepend-icon="mdiEye"
          :disabled="!openIdCandidate"
          @click="openById"
        >
          Open
        </v-btn>
      </div>
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
          <v-menu :close-on-content-click="false" location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" :icon="mdiCog" size="small" variant="text" title="Configure columns" />
            </template>
            <v-card min-width="260" class="pa-3">
              <div class="text-caption font-weight-bold mb-1">Columns</div>
              <v-checkbox
                v-for="header in columnOptions"
                :key="String(header.value)"
                :label="header.title"
                :model-value="prefsStore.visibleColumns.includes(header.value as never)"
                density="compact"
                hide-details
                @update:modelValue="prefsStore.toggleColumn(header.value as never)"
              />
            </v-card>
          </v-menu>
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
      hover
      item-value="id"
      class="lag-reports-table"
      @update:options="onTableOptionsUpdate"
      @click:row="onRowClick"
    >
      <template v-for="header in headers" :key="String(header.value)" v-slot:[`item.${header.value}`]="{ item }">
        <lag-report-row-cells
          :report="item"
          :column="String(header.value)"
          @open="openDetail(item.id)"
          @filter-player="filterByPlayer"
          @filter-server-node="filterByServerNode"
          @filter-proxy="filterByProxy"
          @filter-tag="filterByTag"
        />
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
import { mdiCog, mdiEye, mdiRefresh } from "@mdi/js";
import debounce from "debounce";
import { EAdminRouteName } from "@/router/types";
import { useLagReportsStore } from "@/store/admin/lagReports/store";
import { useLagReportsPrefsStore } from "@/store/admin/lagReports/prefs";
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
import { LagReportListItem, LagReportQueryParams } from "@/store/admin/lagReports/types";
import { ALL_HEADERS } from "@/components/admin/lag-reports/columns";
import LagReportFilterBar from "@/components/admin/lag-reports/filter-bar/LagReportFilterBar.vue";
import LagReportRowCells from "@/components/admin/lag-reports/LagReportRowCells.vue";

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
  components: { LagReportFilterBar, LagReportRowCells },
  setup() {
    const lagReportsStore = useLagReportsStore();
    const filtersStore = useLagReportsFiltersStore();
    const prefsStore = useLagReportsPrefsStore();
    const router = useRouter();
    const route = useRoute();

    const reportsError = computed(() => lagReportsStore.reportsError);

    const tableOptions = ref({
      page: 1,
      itemsPerPage: 25,
    });

    const headers = computed(() =>
      ALL_HEADERS.filter((h) => h.value === "actions" || prefsStore.visibleColumns.includes(h.value as never))
    );

    const columnOptions = ALL_HEADERS.filter((h) => h.value !== "actions");

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

    // ── Click-to-filter ──────────────────────────────────────────────

    function filterByPlayer(battleTag: string) {
      filtersStore.battleTag = battleTag;
      onFilterChange();
    }

    // Clicking a server in a row or group header means "just this node", so it
    // replaces the selection — and commits the exact id, not a name prefix.
    function filterByServerNode(id: number, name: string) {
      filtersStore.serverNames = [];
      filtersStore.serverNodes = [{ id, name }];
      onFilterChange();
    }

    function filterByProxy(proxyName: string) {
      filtersStore.proxyName = proxyName;
      onFilterChange();
    }

    // Toggle semantics shared with the tags editor: clicking a row's active
    // tag chip clears the filter again.
    function filterByTag(tag: string) {
      filtersStore.connectionIssueTag = filtersStore.connectionIssueTag === tag ? "" : tag;
      onFilterChange();
    }

    function openDetail(id: string) {
      persistUiState();
      router.push({ name: EAdminRouteName.LAG_REPORT_DETAIL, params: { id }, query: routeQueryFromState() });
    }

    function onRowClick(_event: unknown, row: { item?: LagReportListItem }) {
      if (row?.item?.id) {
        openDetail(row.item.id);
      }
    }

    // ── Open by ID ───────────────────────────────────────────────────

    // Takes a bare report id or a pasted link to one: admins trade detail
    // URLs, and the id is the last path segment of such a URL.
    function normalizeReportId(raw: string): string {
      const withoutQuery = raw.trim().split(/[?#]/)[0];
      const segments = withoutQuery.split("/").filter(Boolean);
      return segments.length > 0 ? segments[segments.length - 1] : "";
    }

    const openIdInput = ref("");
    const openIdCandidate = computed(() => normalizeReportId(openIdInput.value));

    // An id that matches no report is the detail page's to report — it already
    // renders "Report not found." — so there is nothing to validate here.
    function openById() {
      if (!openIdCandidate.value) return;
      openDetail(openIdCandidate.value);
    }

    onMounted(() => {
      persistUiState();
      syncRouteQuery();
      loadReports();
    });

    return {
      filtersStore,
      prefsStore,
      reportsError,
      tableOptions,
      headers,
      columnOptions,
      tableItems,
      tableTotal,
      tableLoading,
      emptyWindowNote,
      onFilterChange,
      onTableOptionsUpdate,
      refreshResults,
      explicitMode,
      filterByPlayer,
      filterByServerNode,
      filterByProxy,
      filterByTag,
      openDetail,
      onRowClick,
      openIdInput,
      openIdCandidate,
      openById,
      mdiCog,
      mdiEye,
      mdiRefresh,
    };
  },
});
</script>

<style lang="scss" scoped>
.lag-reports-table :deep(tbody tr) {
  cursor: pointer;
}

// v-card-title clips its content (overflow: hidden, white-space: nowrap) to
// ellipsize long titles. The ID field lives in this row, so let it show in
// full and wrap under the heading when the viewport is narrow.
.lag-reports-title {
  overflow: visible;
  white-space: normal;
}

.open-by-id {
  width: 100%;
  max-width: 420px;
}
</style>
