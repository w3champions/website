<template>
  <div>
    <v-card-title class="pt-3">
      Player Warnings
    </v-card-title>

    <div class="d-flex align-center px-4 ga-4">
      <div class="w-33">
        <player-search
          search-label="Search player"
          @playerFound="onPlayerFound"
          @searchCleared="onPlayerSearchCleared"
        />
      </div>
      <v-select
        v-model="statusFilter"
        class="w-25"
        :items="statusItems"
        item-title="title"
        item-value="value"
        label="Status"
        variant="underlined"
        color="primary"
        clearable
        hide-details
      />
      <v-spacer />
      <v-btn class="bg-primary text-w3-race-bg" @click="openCreateDialog">
        New warning
      </v-btn>
    </div>

    <v-alert
      v-if="errorMessage"
      class="ma-4"
      type="error"
      variant="tonal"
      density="compact"
      closable
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </v-alert>

    <v-data-table-server
      class="px-4"
      :headers="headers"
      :items="warnings"
      :items-length="total"
      :items-per-page="tableOptions.itemsPerPage"
      :items-per-page-options="[10, 25, 50, 100]"
      :loading="loading"
      :page="tableOptions.page"
      :sort-by="[]"
      item-value="_id"
      @update:options="onTableOptionsUpdate"
    >
      <template v-slot:item.title="{ item }">
        <div class="font-weight-medium">{{ item.title.en }}</div>
        <div class="text-medium-emphasis text-caption">{{ item.body.en }}</div>
      </template>

      <template v-slot:item.status="{ item }">
        <v-chip :color="statusColor(item.status)" size="small" variant="tonal">
          {{ item.status }}
        </v-chip>
      </template>

      <template v-slot:item.severity="{ item }">
        <v-chip :color="severityColor(item.severity)" size="small" variant="tonal">
          <v-icon start size="small">{{ severityIcon(item.severity) }}</v-icon>
          {{ item.severity }}
        </v-chip>
      </template>

      <template v-slot:item.createdAt="{ item }">
        {{ formatDate(item.createdAt) }}
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn
          v-if="canCancel(item)"
          size="small"
          variant="text"
          color="error"
          @click="cancelWarning(item)"
        >
          Cancel
        </v-btn>
      </template>
    </v-data-table-server>

    <v-dialog v-model="createDialogOpen" max-width="720px">
      <v-card>
        <v-card-title class="pt-3">
          New Player Warning
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <player-search
                :set-autofocus="false"
                search-label="Player"
                @playerFound="onCreatePlayerFound"
                @searchCleared="createForm.targetBattleTag = ''"
              />
              <div v-if="createForm.targetBattleTag" class="text-caption text-medium-emphasis mt-1">
                Selected: {{ createForm.targetBattleTag }}
              </div>
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="createForm.title.en" label="Title" variant="underlined" color="primary" />
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="createForm.body.en" label="Message" rows="5" variant="underlined" color="primary" />
            </v-col>
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2">Severity</div>
              <v-btn-toggle
                v-model="createForm.severity"
                mandatory
                divided
                class="warning-severity-toggle"
              >
                <v-btn
                  v-for="item in severityItems"
                  :key="item.value"
                  :value="item.value"
                  :color="item.color"
                  class="warning-severity-button"
                >
                  <v-icon start>{{ item.icon }}</v-icon>
                  {{ item.title }}
                </v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="createDialogOpen = false">Cancel</v-btn>
          <v-btn
            class="bg-primary text-w3-race-bg"
            :loading="saving"
            :disabled="!canCreate"
            @click="createWarning"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, watch } from "vue";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import AdminService from "@/services/admin/AdminService";
import { useOauthStore } from "@/store/oauth/store";
import { EPlayerWarningSeverity, EPlayerWarningStatus, type CreatePlayerWarningRequest, type PlayerWarning } from "@/store/admin/types";
import { mdiAlertCircleOutline, mdiAlertOctagonOutline, mdiInformationOutline } from "@mdi/js";

type StatusFilter = EPlayerWarningStatus | "";
type VuetifyTableUpdateOptions = {
  page: number;
  itemsPerPage: number;
};

export default defineComponent({
  name: "AdminWarnings",
  components: {
    PlayerSearch,
  },
  setup() {
    const oauthStore = useOauthStore();
    const warnings = ref<PlayerWarning[]>([]);
    const total = ref<number>(0);
    const loading = ref<boolean>(false);
    const saving = ref<boolean>(false);
    const errorMessage = ref<string>("");
    const selectedBattleTag = ref<string>("");
    const statusFilter = ref<StatusFilter>("");
    const createDialogOpen = ref<boolean>(false);
    const tableOptions = ref<VuetifyTableUpdateOptions>({ page: 1, itemsPerPage: 25 });

    const createForm = reactive<CreatePlayerWarningRequest>({
      targetBattleTag: "",
      severity: EPlayerWarningSeverity.Warning,
      title: { en: "" },
      body: { en: "" },
    });

    const headers = [
      { title: "Player", key: "targetBattleTag", sortable: false },
      { title: "Warning", key: "title", sortable: false },
      { title: "Severity", key: "severity", sortable: false },
      { title: "Status", key: "status", sortable: false },
      { title: "Issued By", key: "issuedByBattleTag", sortable: false },
      { title: "Created", key: "createdAt", sortable: false },
      { title: "", key: "actions", sortable: false },
    ];

    const statusItems = [
      { title: "All", value: "" },
      ...Object.values(EPlayerWarningStatus).map((status) => ({ title: status, value: status })),
    ];

    const severityItems = [
      { title: "Info", value: EPlayerWarningSeverity.Info, color: "success", icon: mdiInformationOutline },
      { title: "Warning", value: EPlayerWarningSeverity.Warning, color: "warning", icon: mdiAlertCircleOutline },
      { title: "Critical", value: EPlayerWarningSeverity.Critical, color: "error", icon: mdiAlertOctagonOutline },
    ];

    const canCreate = computed<boolean>(() =>
      !!createForm.targetBattleTag
      && !!createForm.title.en.trim()
      && !!createForm.body.en.trim()
    );

    async function loadWarnings(): Promise<void> {
      loading.value = true;
      errorMessage.value = "";
      try {
        const result = await AdminService.getWarnings(oauthStore.token, {
          page: tableOptions.value.page,
          itemsPerPage: tableOptions.value.itemsPerPage,
          battleTag: selectedBattleTag.value,
          status: statusFilter.value,
        });
        warnings.value = result.warnings;
        total.value = result.total;
      } catch (error) {
        warnings.value = [];
        total.value = 0;
        errorMessage.value = getErrorMessage(error);
      } finally {
        loading.value = false;
      }
    }

    function onTableOptionsUpdate(options: VuetifyTableUpdateOptions): void {
      tableOptions.value = {
        page: options.page > 0 ? options.page : 1,
        itemsPerPage: options.itemsPerPage > 0 ? options.itemsPerPage : 25,
      };
      loadWarnings();
    }

    function onPlayerFound(battleTag: string): void {
      selectedBattleTag.value = battleTag;
    }

    function onPlayerSearchCleared(): void {
      selectedBattleTag.value = "";
    }

    function onCreatePlayerFound(battleTag: string): void {
      createForm.targetBattleTag = battleTag;
    }

    function openCreateDialog(): void {
      createForm.targetBattleTag = selectedBattleTag.value;
      createForm.severity = EPlayerWarningSeverity.Warning;
      createForm.title = { en: "" };
      createForm.body = { en: "" };
      createDialogOpen.value = true;
    }

    async function createWarning(): Promise<void> {
      if (!canCreate.value) return;

      saving.value = true;
      errorMessage.value = "";
      try {
        await AdminService.createWarning(oauthStore.token, {
          targetBattleTag: createForm.targetBattleTag,
          severity: createForm.severity,
          title: { en: createForm.title.en.trim() },
          body: { en: createForm.body.en.trim() },
        });
        createDialogOpen.value = false;
        await loadWarnings();
      } catch (error) {
        errorMessage.value = getErrorMessage(error);
      } finally {
        saving.value = false;
      }
    }

    async function cancelWarning(warning: PlayerWarning): Promise<void> {
      errorMessage.value = "";
      try {
        await AdminService.cancelWarning(oauthStore.token, warning._id);
        await loadWarnings();
      } catch (error) {
        errorMessage.value = getErrorMessage(error);
      }
    }

    function canCancel(warning: PlayerWarning): boolean {
      return warning.status === EPlayerWarningStatus.Pending || warning.status === EPlayerWarningStatus.Sent;
    }

    function statusColor(status: EPlayerWarningStatus): string {
      switch (status) {
        case EPlayerWarningStatus.Acknowledged:
          return "success";
        case EPlayerWarningStatus.Cancelled:
          return "medium-emphasis";
        case EPlayerWarningStatus.Sent:
          return "info";
        default:
          return "warning";
      }
    }

    function severityColor(severity: EPlayerWarningSeverity): string {
      switch (severity) {
        case EPlayerWarningSeverity.Info:
          return "success";
        case EPlayerWarningSeverity.Critical:
          return "error";
        default:
          return "warning";
      }
    }

    function severityIcon(severity: EPlayerWarningSeverity): string {
      switch (severity) {
        case EPlayerWarningSeverity.Info:
          return mdiInformationOutline;
        case EPlayerWarningSeverity.Critical:
          return mdiAlertOctagonOutline;
        default:
          return mdiAlertCircleOutline;
      }
    }

    function formatDate(value?: string): string {
      return value ? new Date(value).toLocaleString() : "";
    }

    function getErrorMessage(error: unknown): string {
      return error instanceof Error ? error.message : "Something went wrong.";
    }

    watch([selectedBattleTag, statusFilter], () => {
      tableOptions.value.page = 1;
      loadWarnings();
    });

    onMounted(loadWarnings);

    return {
      warnings,
      total,
      loading,
      saving,
      errorMessage,
      selectedBattleTag,
      statusFilter,
      createDialogOpen,
      tableOptions,
      createForm,
      headers,
      statusItems,
      severityItems,
      canCreate,
      onTableOptionsUpdate,
      onPlayerFound,
      onPlayerSearchCleared,
      onCreatePlayerFound,
      openCreateDialog,
      createWarning,
      cancelWarning,
      canCancel,
      statusColor,
      severityColor,
      severityIcon,
      formatDate,
    };
  },
});
</script>

<style scoped>
.warning-severity-toggle {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
}

.warning-severity-button {
  min-height: 56px;
}
</style>
