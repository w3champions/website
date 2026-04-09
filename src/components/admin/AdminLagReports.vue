<template>
  <div>
    <v-card-title class="pt-3">
      Lag Reports
    </v-card-title>

    <v-container>
      <v-row dense>
        <v-col cols="12" md="3">
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
        <v-col cols="12" md="2">
          <v-checkbox
            v-model="filters.explicitOnly"
            label="Explicit only"
            color="primary"
            density="compact"
            hide-details
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
          <v-chip v-if="p.isExplicit" size="x-small" color="warning" variant="flat">explicit</v-chip>
          <v-chip v-if="p.connectionType === 'Proxied'" size="x-small" color="info" variant="flat">
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
import { useRouter } from "vue-router";
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

export default defineComponent({
  name: "AdminLagReports",
  setup() {
    const lagReportsStore = useLagReportsStore();
    const router = useRouter();

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

    const debouncedLoad = debounce(loadReports, 400);

    function onFilterChange() {
      tableOptions.value.page = 1;
      debouncedLoad();
    }

    function onTableOptionsUpdate(options: VuetifyTableUpdateOptions) {
      tableOptions.value.page = options.page;
      tableOptions.value.itemsPerPage = options.itemsPerPage;
      loadReports();
    }

    function formatDate(iso: string): string {
      if (!iso) return "";
      const d = new Date(iso);
      return d.toLocaleString();
    }

    function openDetail(id: string) {
      router.push({ name: EAdminRouteName.LAG_REPORT_DETAIL, params: { id } });
    }

    onMounted(() => {
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
      formatDate,
      openDetail,
      mdiCheckCircle,
      mdiCloseCircle,
      mdiEye,
    };
  },
});
</script>
