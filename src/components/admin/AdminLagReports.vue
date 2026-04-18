<template>
  <div>
    <v-card-title class="pt-3">
      Lag Reports
    </v-card-title>

    <v-container>
      <v-row dense>
        <v-col cols="12" md="2">
          <v-text-field
            v-model="filters.battleTag"
            label="BattleTag"
            variant="underlined"
            color="primary"
            clearable
            @update:modelValue="onFilterChange"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model="filters.gameSearch"
            label="Game ID / Name"
            variant="underlined"
            color="primary"
            clearable
            @update:modelValue="onFilterChange"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model="filters.serverName"
            label="Server Name"
            variant="underlined"
            color="primary"
            clearable
            @update:modelValue="onFilterChange"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model="filters.proxyName"
            label="Proxy Name"
            variant="underlined"
            color="primary"
            clearable
            @update:modelValue="onFilterChange"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model="filters.proxyIp"
            label="Proxy IP"
            variant="underlined"
            color="primary"
            clearable
            @update:modelValue="onFilterChange"
          />
        </v-col>
      </v-row>
      <v-row dense>
        <v-col cols="12" md="2">
          <v-select
            v-model="filters.issueCategory"
            :items="issueCategories"
            label="Issue Category"
            variant="underlined"
            color="primary"
            clearable
            @update:modelValue="onFilterChange"
          />
        </v-col>
        <v-col cols="12" md="2" class="d-flex justify-center align-center">
          <v-switch
            v-model="filters.explicitOnly"
            label="Explicit only"
            color="primary"
            density="compact"
            hide-details
            class="flex-grow-0"
            @update:modelValue="onFilterChange"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model="filters.dateFrom"
            label="Date from"
            type="date"
            variant="underlined"
            color="primary"
            clearable
            @update:modelValue="onFilterChange"
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model="filters.dateTo"
            label="Date to"
            type="date"
            variant="underlined"
            color="primary"
            clearable
            @update:modelValue="onFilterChange"
          />
        </v-col>
        <v-col cols="12" md="2" class="d-flex align-center">
          <v-btn
            color="primary"
            variant="outlined"
            block
            @click="refreshResults"
          >
            Refresh results
          </v-btn>
        </v-col>
      </v-row>
    </v-container>

    <v-data-table-server
      :headers="headers"
      :items="reports"
      :items-length="total"
      :items-per-page="tableOptions.itemsPerPage"
      :items-per-page-options="[10, 25, 50]"
      :page="tableOptions.page"
      :loading="loading"
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
    </v-data-table-server>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref } from "vue";
import { useLagReportsStore } from "@/store/admin/lagReports/store";
import { LagReportQueryParams } from "@/store/admin/lagReports/types";
import { mdiCheckCircle, mdiCloseCircle, mdiEye } from "@mdi/js";
import { useRoute, useRouter } from "vue-router";
import { EAdminRouteName } from "@/router/types";
import debounce from "debounce";
import { DataTableHeader } from "vuetify";

type VuetifyTableUpdateOptions = {
  page: number;
  itemsPerPage: number;
  sortBy: Array<{ key: string; order: string }>;
  groupBy: Array<string>;
  search: string;
};

type LagReportsUiState = {
  filters: {
    battleTag: string;
    gameSearch: string;
    serverName: string;
    proxyName: string;
    proxyIp: string;
    issueCategory: string;
    explicitOnly: boolean;
    dateFrom: string;
    dateTo: string;
  };
  tableOptions: {
    page: number;
    itemsPerPage: number;
  };
};

const LAG_REPORTS_UI_STATE_KEY = "admin-lag-reports-ui-state";

export default defineComponent({
  name: "AdminLagReports",
  setup() {
    const lagReportsStore = useLagReportsStore();
    const router = useRouter();
    const route = useRoute();

    const reports = computed(() => lagReportsStore.reports);
    const total = computed(() => lagReportsStore.total);
    const loading = computed(() => lagReportsStore.loading);

    const tableOptions = ref({
      page: 1,
      itemsPerPage: 25,
    });

    const filters = reactive({
      battleTag: "",
      gameSearch: "",
      serverName: "",
      proxyName: "",
      proxyIp: "",
      issueCategory: "",
      explicitOnly: false,
      dateFrom: "",
      dateTo: "",
    });

    const issueCategories = [
      "InputDelay",
      "GameStutter",
      "WaitingForPlayers",
      "RubberBanding",
      "SpikeLag",
      "ConsistentLag",
      "Reconnecting",
      "FullDisconnect",
      "Desync",
      "FpsDrops",
      "GameCrashed",
      "Other",
    ];

    const headers: DataTableHeader[] = [
      { title: "Created", value: "createdAt", sortable: false, width: "140px" },
      { title: "Flo Game", value: "floGameId", sortable: false, width: "100px" },
      { title: "Game", value: "gameName", sortable: false },
      { title: "Server", value: "serverNodeName", sortable: false, width: "120px" },
      { title: "Explicit", value: "hasExplicitReport", sortable: false, width: "80px", align: "center" },
      { title: "Players", value: "players", sortable: false },
      { title: "", value: "actions", sortable: false, width: "100px", align: "center" },
    ];

    function buildParams(): LagReportQueryParams {
      return {
        page: tableOptions.value.page - 1,
        pageSize: tableOptions.value.itemsPerPage,
        battleTag: filters.battleTag || undefined,
        gameSearch: filters.gameSearch || undefined,
        serverName: filters.serverName || undefined,
        proxyName: filters.proxyName || undefined,
        proxyIp: filters.proxyIp || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        issueCategory: filters.issueCategory || undefined,
        explicitOnly: filters.explicitOnly || undefined,
      };
    }

    async function loadReports() {
      await lagReportsStore.loadReports(buildParams());
    }

    function routeQueryFromState(): Record<string, string> {
      const query: Record<string, string> = {};

      if (filters.battleTag) query.battleTag = filters.battleTag;
      if (filters.gameSearch) query.gameSearch = filters.gameSearch;
      if (filters.serverName) query.serverName = filters.serverName;
      if (filters.proxyName) query.proxyName = filters.proxyName;
      if (filters.proxyIp) query.proxyIp = filters.proxyIp;
      if (filters.issueCategory) query.issueCategory = filters.issueCategory;
      if (filters.explicitOnly) query.explicitOnly = "true";
      if (filters.dateFrom) query.dateFrom = filters.dateFrom;
      if (filters.dateTo) query.dateTo = filters.dateTo;

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
        filters: {
          battleTag: filters.battleTag,
          gameSearch: filters.gameSearch,
          serverName: filters.serverName,
          proxyName: filters.proxyName,
          proxyIp: filters.proxyIp,
          issueCategory: filters.issueCategory,
          explicitOnly: filters.explicitOnly,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        },
        tableOptions: {
          page: tableOptions.value.page,
          itemsPerPage: tableOptions.value.itemsPerPage,
        },
      };

      window.sessionStorage.setItem(LAG_REPORTS_UI_STATE_KEY, JSON.stringify(state));
    }

    function hydrateStateFromStorage() {
      if (typeof window === "undefined") return;

      const raw = window.sessionStorage.getItem(LAG_REPORTS_UI_STATE_KEY);
      if (!raw) return;

      try {
        const state = JSON.parse(raw) as LagReportsUiState;

        filters.battleTag = state.filters?.battleTag ?? "";
        filters.gameSearch = state.filters?.gameSearch ?? "";
        filters.serverName = state.filters?.serverName ?? "";
        filters.proxyName = state.filters?.proxyName ?? "";
        filters.proxyIp = state.filters?.proxyIp ?? "";
        filters.issueCategory = state.filters?.issueCategory ?? "";
        filters.explicitOnly = Boolean(state.filters?.explicitOnly);
        filters.dateFrom = state.filters?.dateFrom ?? "";
        filters.dateTo = state.filters?.dateTo ?? "";

        tableOptions.value.page = state.tableOptions?.page && state.tableOptions.page > 0 ? state.tableOptions.page : 1;
        tableOptions.value.itemsPerPage =
          state.tableOptions?.itemsPerPage && state.tableOptions.itemsPerPage > 0 ? state.tableOptions.itemsPerPage : 25;
      } catch (_error) {
        window.sessionStorage.removeItem(LAG_REPORTS_UI_STATE_KEY);
      }
    }

    function hydrateStateFromQuery() {
      const hasQueryState =
        typeof route.query.battleTag === "string" ||
        typeof route.query.gameSearch === "string" ||
        typeof route.query.serverName === "string" ||
        typeof route.query.proxyName === "string" ||
        typeof route.query.proxyIp === "string" ||
        typeof route.query.issueCategory === "string" ||
        route.query.explicitOnly === "true" ||
        typeof route.query.dateFrom === "string" ||
        typeof route.query.dateTo === "string" ||
        typeof route.query.page === "string" ||
        typeof route.query.itemsPerPage === "string";

      if (!hasQueryState) {
        hydrateStateFromStorage();
        return;
      }

      filters.battleTag = typeof route.query.battleTag === "string" ? route.query.battleTag : "";
      filters.gameSearch = typeof route.query.gameSearch === "string" ? route.query.gameSearch : "";
      filters.serverName = typeof route.query.serverName === "string" ? route.query.serverName : "";
      filters.proxyName = typeof route.query.proxyName === "string" ? route.query.proxyName : "";
      filters.proxyIp = typeof route.query.proxyIp === "string" ? route.query.proxyIp : "";
      filters.issueCategory = typeof route.query.issueCategory === "string" ? route.query.issueCategory : "";
      filters.explicitOnly = route.query.explicitOnly === "true";
      filters.dateFrom = typeof route.query.dateFrom === "string" ? route.query.dateFrom : "";
      filters.dateTo = typeof route.query.dateTo === "string" ? route.query.dateTo : "";

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
      persistUiState();
      syncRouteQuery();
      loadReports();
    }

    function formatDate(iso: string): string {
      if (!iso) return "";
      const d = new Date(iso);
      return d.toLocaleString();
    }

    function openDetail(id: string) {
      persistUiState();
      router.push({ name: EAdminRouteName.LAG_REPORT_DETAIL, params: { id }, query: routeQueryFromState() });
    }

    onMounted(() => {
      persistUiState();
      syncRouteQuery();
      loadReports();
    });

    return {
      reports,
      total,
      loading,
      tableOptions,
      filters,
      issueCategories,
      headers,
      onFilterChange,
      onTableOptionsUpdate,
      refreshResults,
      formatDate,
      openDetail,
      mdiCheckCircle,
      mdiCloseCircle,
      mdiEye,
    };
  },
});
</script>
