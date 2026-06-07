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
          @searchRequested="onPlayerFound"
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
      <v-btn variant="text" :loading="loading" @click="loadWarnings">
        <v-icon start>{{ mdiRefresh }}</v-icon>
        Refresh
      </v-btn>
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
        <div class="warning-summary">
          <div class="font-weight-medium warning-summary-title">{{ getDefinitionText(item.title, "en") }}</div>
          <div class="text-medium-emphasis text-caption warning-summary-body">{{ getDefinitionText(item.body, "en") }}</div>
        </div>
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
        <div class="warning-timeline">
          <div>
            <span class="text-medium-emphasis">Created:</span>
            {{ formatDate(item.createdAt) }}
          </div>
          <div>
            <span class="text-medium-emphasis">Sent:</span>
            {{ item.sentAt ? formatDate(item.sentAt) : "Not yet" }}
          </div>
          <div>
            <span class="text-medium-emphasis">Ack:</span>
            {{ acknowledgementText(item) }}
          </div>
        </div>
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

    <v-dialog v-model="createDialogOpen" max-width="760px">
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
              <v-select
                v-model="selectedWarningOption"
                :items="definitionItems"
                item-title="title"
                item-value="value"
                label="Warning"
                variant="underlined"
                color="primary"
                :loading="definitionsLoading"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-select
                :model-value="previewSeverity"
                :items="severityItems"
                item-title="title"
                item-value="value"
                label="Severity"
                variant="underlined"
                color="primary"
                :disabled="!isCustomWarning"
                @update:model-value="customSeverity = $event as EPlayerWarningSeverity"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <v-icon :color="item.raw.color">{{ item.raw.icon }}</v-icon>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>

            <v-col cols="12" md="8">
              <v-text-field
                :model-value="titleFieldValue"
                label="Title"
                variant="underlined"
                color="primary"
                :disabled="!isCustomWarning"
                @update:model-value="customTitle = String($event)"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                :model-value="bodyFieldValue"
                label="Message"
                rows="4"
                variant="underlined"
                color="primary"
                :disabled="!isCustomWarning"
                @update:model-value="customBody = String($event)"
              />
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
            Send
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
import { EPlayerWarningSeverity, EPlayerWarningStatus, type CreatePlayerWarningRequest, type PlayerWarning, type PlayerWarningDefinition, type PlayerWarningTranslations } from "@/store/admin/types";
import { mdiAlertCircleOutline, mdiAlertOctagonOutline, mdiInformationOutline, mdiRefresh } from "@mdi/js";

type StatusFilter = EPlayerWarningStatus | "";
type VuetifyTableUpdateOptions = {
  page: number;
  itemsPerPage: number;
};

const DEFAULT_PREVIEW_LOCALE = "en";
const CUSTOM_WARNING_OPTION = "__custom";

export default defineComponent({
  name: "AdminWarnings",
  components: {
    PlayerSearch,
  },
  setup() {
    const oauthStore = useOauthStore();
    const warnings = ref<PlayerWarning[]>([]);
    const warningDefinitions = ref<PlayerWarningDefinition[]>([]);
    const total = ref<number>(0);
    const loading = ref<boolean>(false);
    const definitionsLoading = ref<boolean>(false);
    const saving = ref<boolean>(false);
    const errorMessage = ref<string>("");
    const selectedBattleTag = ref<string>("");
    const statusFilter = ref<StatusFilter>("");
    const selectedWarningOption = ref<string>(CUSTOM_WARNING_OPTION);
    const customSeverity = ref<EPlayerWarningSeverity>(EPlayerWarningSeverity.Warning);
    const customTitle = ref<string>("");
    const customBody = ref<string>("");
    const createDialogOpen = ref<boolean>(false);
    const tableOptions = ref<VuetifyTableUpdateOptions>({ page: 1, itemsPerPage: 25 });

    const createForm = reactive<CreatePlayerWarningRequest>({
      targetBattleTag: "",
      warningDefinitionId: undefined,
    });

    const headers = [
      { title: "Player", key: "targetBattleTag", sortable: false, width: "18%" },
      { title: "Warning", key: "title", sortable: false, width: "34%" },
      { title: "Severity", key: "severity", sortable: false },
      { title: "Status", key: "status", sortable: false },
      { title: "Issued By", key: "issuedByBattleTag", sortable: false },
      { title: "Timeline", key: "createdAt", sortable: false, width: "22%" },
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

    const definitionItems = computed(() => [
      { title: "Custom", value: CUSTOM_WARNING_OPTION },
      ...warningDefinitions.value.map((definition) => ({
        title: `${getDefinitionText(definition.title, DEFAULT_PREVIEW_LOCALE)} (${definition.severity})`,
        value: definition._id,
      })),
    ]);

    const isCustomWarning = computed<boolean>(() => selectedWarningOption.value === CUSTOM_WARNING_OPTION);

    const selectedDefinition = computed<PlayerWarningDefinition | undefined>(() =>
      warningDefinitions.value.find((definition) => definition._id === selectedWarningOption.value)
    );

    const previewSeverity = computed<EPlayerWarningSeverity>(() =>
      selectedDefinition.value?.severity ?? customSeverity.value
    );

    const titleFieldValue = computed<string>(() =>
      selectedDefinition.value ? getDefinitionText(selectedDefinition.value.title, DEFAULT_PREVIEW_LOCALE) : customTitle.value
    );

    const bodyFieldValue = computed<string>(() =>
      selectedDefinition.value ? getDefinitionText(selectedDefinition.value.body, DEFAULT_PREVIEW_LOCALE) : customBody.value
    );

    const canCreate = computed<boolean>(() =>
      !!createForm.targetBattleTag
      && (
        !!selectedDefinition.value
        || (isCustomWarning.value && !!customTitle.value.trim() && !!customBody.value.trim())
      )
    );

    let loadWarningsRequestId = 0;

    async function loadWarnings(): Promise<void> {
      const requestId = ++loadWarningsRequestId;
      loading.value = true;
      errorMessage.value = "";
      try {
        const result = await AdminService.getWarnings(oauthStore.token, {
          page: tableOptions.value.page,
          itemsPerPage: tableOptions.value.itemsPerPage,
          battleTag: selectedBattleTag.value.trim(),
          status: statusFilter.value,
        });
        if (requestId !== loadWarningsRequestId) return;
        warnings.value = result.warnings;
        total.value = result.total;
      } catch (error) {
        if (requestId !== loadWarningsRequestId) return;
        warnings.value = [];
        total.value = 0;
        errorMessage.value = getErrorMessage(error);
      } finally {
        if (requestId === loadWarningsRequestId) {
          loading.value = false;
        }
      }
    }

    async function loadWarningDefinitions(): Promise<void> {
      definitionsLoading.value = true;
      try {
        warningDefinitions.value = await AdminService.getWarningDefinitions(oauthStore.token);
      } catch (error) {
        warningDefinitions.value = [];
        errorMessage.value = getErrorMessage(error);
      } finally {
        definitionsLoading.value = false;
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
      selectedBattleTag.value = battleTag.trim();
    }

    function onPlayerSearchCleared(): void {
      selectedBattleTag.value = "";
    }

    function onCreatePlayerFound(battleTag: string): void {
      createForm.targetBattleTag = battleTag;
    }

    async function openCreateDialog(): Promise<void> {
      if (warningDefinitions.value.length === 0) {
        await loadWarningDefinitions();
      }

      createForm.targetBattleTag = selectedBattleTag.value;
      selectedWarningOption.value = CUSTOM_WARNING_OPTION;
      createForm.warningDefinitionId = undefined;
      customSeverity.value = EPlayerWarningSeverity.Warning;
      customTitle.value = "";
      customBody.value = "";
      createDialogOpen.value = true;
    }

    async function createWarning(): Promise<void> {
      if (!canCreate.value) return;

      saving.value = true;
      errorMessage.value = "";
      try {
        const request: CreatePlayerWarningRequest = {
          targetBattleTag: createForm.targetBattleTag,
        };

        if (selectedDefinition.value) {
          request.warningDefinitionId = selectedDefinition.value._id;
        } else {
          request.severity = customSeverity.value;
          request.title = { en: customTitle.value.trim() };
          request.body = { en: customBody.value.trim() };
        }

        await AdminService.createWarning(oauthStore.token, request);
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

    function acknowledgementText(warning: PlayerWarning): string {
      if (warning.acknowledgedAt) {
        return formatDate(warning.acknowledgedAt);
      }

      if (warning.cancelledAt) {
        return `Cancelled ${formatDate(warning.cancelledAt)}`;
      }

      return "Waiting";
    }

    function getDefinitionText(translations: PlayerWarningTranslations, locale: string): string {
      return translations[locale]?.trim()
        || translations.en?.trim()
        || Object.values(translations).find((value) => !!value?.trim())
        || "";
    }

    function getErrorMessage(error: unknown): string {
      return error instanceof Error ? error.message : "Something went wrong.";
    }

    watch([selectedBattleTag, statusFilter], () => {
      tableOptions.value.page = 1;
      loadWarnings();
    });

    onMounted(async () => {
      await Promise.all([loadWarnings(), loadWarningDefinitions()]);
    });

    return {
      warnings,
      warningDefinitions,
      total,
      loading,
      definitionsLoading,
      saving,
      errorMessage,
      selectedBattleTag,
      statusFilter,
      selectedWarningOption,
      customSeverity,
      customTitle,
      customBody,
      createDialogOpen,
      tableOptions,
      createForm,
      headers,
      statusItems,
      severityItems,
      definitionItems,
      isCustomWarning,
      selectedDefinition,
      previewSeverity,
      titleFieldValue,
      bodyFieldValue,
      canCreate,
      mdiRefresh,
      loadWarnings,
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
      acknowledgementText,
      getDefinitionText,
    };
  },
});
</script>

<style scoped>
.warning-summary {
  max-width: min(380px, 34vw);
}

.warning-summary-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.warning-summary-body {
  display: -webkit-box;
  line-height: 1.35;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.warning-timeline {
  font-size: 0.78rem;
  line-height: 1.4;
  min-width: 190px;
}
</style>
