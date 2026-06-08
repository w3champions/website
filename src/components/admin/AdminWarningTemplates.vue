<template>
  <div>
    <v-card-title class="pt-3">
      Warning Templates
    </v-card-title>

    <div class="d-flex align-center px-4 mb-3">
      <v-switch
        v-model="showDisabled"
        label="Show disabled"
        color="primary"
        hide-details
        density="compact"
        @update:model-value="loadDefinitions()"
      />
      <v-spacer />
      <v-btn class="bg-primary text-w3-race-bg" @click="openCreateDialog">
        Add template
      </v-btn>
    </div>

    <v-alert
      v-if="errorMessage"
      class="mx-4 mb-3"
      type="error"
      variant="tonal"
      density="compact"
      closable
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </v-alert>

    <v-data-table
      class="px-4"
      :headers="headers"
      :items="definitions"
      :loading="loading"
      :items-per-page="25"
      item-value="_id"
    >
      <template v-slot:item.title="{ item }">
        <div class="font-weight-medium">{{ getTranslation(item.title, 'en') }}</div>
        <div class="text-medium-emphasis text-caption">{{ getTranslation(item.body, 'en') }}</div>
      </template>

      <template v-slot:item.severity="{ item }">
        <v-chip :color="severityColor(item.severity)" size="small" variant="tonal">
          <v-icon start size="small">{{ severityIcon(item.severity) }}</v-icon>
          {{ item.severity }}
        </v-chip>
      </template>

      <template v-slot:item.translations="{ item }">
        <v-chip
          :color="translationCount(item) === localeItems.length ? 'success' : 'warning'"
          size="small"
          variant="tonal"
        >
          {{ translationCount(item) }}/{{ localeItems.length }}
        </v-chip>
      </template>

      <template v-slot:item.enabled="{ item }">
        <v-chip :color="item.enabled ? 'success' : 'medium-emphasis'" size="small" variant="tonal">
          {{ item.enabled ? "Enabled" : "Disabled" }}
        </v-chip>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-icon size="small" class="mr-2" @click="openEditDialog(item)">{{ mdiPencil }}</v-icon>
        <v-icon
          v-if="item.enabled"
          size="small"
          color="error"
          @click="disableDefinition(item)"
        >
          {{ mdiDelete }}
        </v-icon>
      </template>
    </v-data-table>

    <v-dialog v-model="dialogOpen" max-width="980px">
      <v-card>
        <v-card-title class="pt-3">
          {{ editedDefinitionId ? "Edit warning template" : "Add warning template" }}
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <v-select
                v-model="editedSeverity"
                :items="severityItems"
                item-title="title"
                item-value="value"
                label="Severity"
                variant="underlined"
                color="primary"
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

            <v-col cols="6" md="4">
              <v-text-field
                v-model.number="editedSortOrder"
                label="Sort order"
                type="number"
                variant="underlined"
                color="primary"
              />
            </v-col>

            <v-col cols="6" md="4">
              <v-switch
                v-model="editedEnabled"
                label="Enabled"
                color="success"
                hide-details
              />
            </v-col>

            <v-col cols="12">
              <v-tabs v-model="editedLocale" color="primary" density="compact" show-arrows>
                <v-tab
                  v-for="locale in localeItems"
                  :key="locale.value"
                  :value="locale.value"
                >
                  {{ locale.value.toUpperCase() }}
                  <v-icon
                    v-if="!hasLocaleTranslation(locale.value)"
                    size="x-small"
                    color="warning"
                    class="ml-1"
                  >
                    {{ mdiAlertCircleOutline }}
                  </v-icon>
                </v-tab>
              </v-tabs>

              <v-window v-model="editedLocale">
                <v-window-item
                  v-for="locale in localeItems"
                  :key="locale.value"
                  :value="locale.value"
                  :transition="false"
                >
                  <div class="text-caption text-medium-emphasis mt-3">
                    {{ locale.title }} {{ locale.value === 'en' ? '(required fallback)' : '(optional, falls back to English)' }}
                  </div>
                  <v-text-field
                    v-model="editedTitle[locale.value]"
                    class="mt-2"
                    label="Title"
                    variant="underlined"
                    color="primary"
                    :required="locale.value === 'en'"
                  />
                  <v-textarea
                    v-model="editedBody[locale.value]"
                    label="Message"
                    rows="5"
                    variant="underlined"
                    color="primary"
                    :required="locale.value === 'en'"
                  />
                </v-window-item>
              </v-window>

              <div class="template-locale-summary text-caption text-medium-emphasis mt-2">
                Filled locales: {{ filledLocaleCount }}/{{ localeItems.length }}.
                Missing locales will use English in the launcher.
              </div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn
            class="bg-primary text-w3-race-bg"
            :loading="saving"
            :disabled="!canSave"
            @click="saveDefinition"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import AdminService from "@/services/admin/AdminService";
import { useOauthStore } from "@/store/oauth/store";
import { EPlayerWarningSeverity, type PlayerWarningDefinition, type PlayerWarningDefinitionRequest, type PlayerWarningTranslations } from "@/store/admin/types";
import { mdiAlertCircleOutline, mdiAlertOctagonOutline, mdiDelete, mdiInformationOutline, mdiPencil } from "@mdi/js";
import { clientLocaleItems } from "@/locales/clientLocaleItems";

const localeItems = clientLocaleItems;

function emptyTranslations(): PlayerWarningTranslations {
  return Object.fromEntries(localeItems.map((locale) => [locale.value, ""])) as PlayerWarningTranslations;
}

export default defineComponent({
  name: "AdminWarningTemplates",
  setup() {
    const oauthStore = useOauthStore();
    const definitions = ref<PlayerWarningDefinition[]>([]);
    const loading = ref<boolean>(false);
    const saving = ref<boolean>(false);
    const showDisabled = ref<boolean>(true);
    const errorMessage = ref<string>("");
    const dialogOpen = ref<boolean>(false);
    const editedDefinitionId = ref<string>("");
    const editedSeverity = ref<EPlayerWarningSeverity>(EPlayerWarningSeverity.Warning);
    const editedEnabled = ref<boolean>(true);
    const editedSortOrder = ref<number>(100);
    const editedLocale = ref<string>("en");
    const editedTitle = ref<PlayerWarningTranslations>(emptyTranslations());
    const editedBody = ref<PlayerWarningTranslations>(emptyTranslations());

    const headers = [
      { title: "Template", key: "title", sortable: false },
      { title: "Severity", key: "severity", sortable: false },
      { title: "Translations", key: "translations", sortable: false },
      { title: "Enabled", key: "enabled", sortable: false },
      { title: "Sort", key: "sortOrder", sortable: true },
      { title: "", key: "actions", sortable: false, align: "end" as const },
    ];

    const severityItems = [
      { title: "Info", value: EPlayerWarningSeverity.Info, color: "success", icon: mdiInformationOutline },
      { title: "Warning", value: EPlayerWarningSeverity.Warning, color: "warning", icon: mdiAlertCircleOutline },
      { title: "Critical", value: EPlayerWarningSeverity.Critical, color: "error", icon: mdiAlertOctagonOutline },
    ];

    const filledLocaleCount = computed<number>(() =>
      localeItems.filter((locale) => hasLocaleTranslation(locale.value)).length
    );

    const canSave = computed<boolean>(() =>
      !!editedTitle.value.en?.trim()
      && !!editedBody.value.en?.trim()
      && Number.isFinite(Number(editedSortOrder.value))
    );

    async function loadDefinitions(): Promise<void> {
      loading.value = true;
      errorMessage.value = "";
      try {
        definitions.value = await AdminService.getWarningDefinitions(oauthStore.token, showDisabled.value);
      } catch (error) {
        definitions.value = [];
        errorMessage.value = getErrorMessage(error);
      } finally {
        loading.value = false;
      }
    }

    function openCreateDialog(): void {
      editedDefinitionId.value = "";
      editedSeverity.value = EPlayerWarningSeverity.Warning;
      editedEnabled.value = true;
      editedSortOrder.value = nextSortOrder();
      editedLocale.value = "en";
      editedTitle.value = emptyTranslations();
      editedBody.value = emptyTranslations();
      dialogOpen.value = true;
    }

    function openEditDialog(definition: PlayerWarningDefinition): void {
      editedDefinitionId.value = definition._id;
      editedSeverity.value = definition.severity;
      editedEnabled.value = definition.enabled;
      editedSortOrder.value = definition.sortOrder ?? 0;
      editedLocale.value = "en";
      editedTitle.value = withLocaleDefaults(definition.title);
      editedBody.value = withLocaleDefaults(definition.body);
      dialogOpen.value = true;
    }

    function closeDialog(): void {
      dialogOpen.value = false;
    }

    async function saveDefinition(): Promise<void> {
      if (!canSave.value) return;

      saving.value = true;
      errorMessage.value = "";
      try {
        const request = buildRequest();
        if (editedDefinitionId.value) {
          await AdminService.updateWarningDefinition(oauthStore.token, editedDefinitionId.value, request);
        } else {
          await AdminService.createWarningDefinition(oauthStore.token, request);
        }
        closeDialog();
        await loadDefinitions();
      } catch (error) {
        errorMessage.value = getErrorMessage(error);
      } finally {
        saving.value = false;
      }
    }

    async function disableDefinition(definition: PlayerWarningDefinition): Promise<void> {
      if (!confirm(`Disable "${getTranslation(definition.title, "en")}"?`)) return;

      errorMessage.value = "";
      try {
        await AdminService.deleteWarningDefinition(oauthStore.token, definition._id);
        await loadDefinitions();
      } catch (error) {
        errorMessage.value = getErrorMessage(error);
      }
    }

    function buildRequest(): PlayerWarningDefinitionRequest {
      return {
        severity: editedSeverity.value,
        title: trimTranslations(editedTitle.value),
        body: trimTranslations(editedBody.value),
        enabled: editedEnabled.value,
        sortOrder: Number(editedSortOrder.value),
      };
    }

    function trimTranslations(translations: PlayerWarningTranslations): PlayerWarningTranslations {
      const result: PlayerWarningTranslations = { en: translations.en.trim() };
      for (const locale of localeItems) {
        const value = translations[locale.value]?.trim();
        if (locale.value !== "en" && value) {
          result[locale.value] = value;
        }
      }
      return result;
    }

    function withLocaleDefaults(translations: PlayerWarningTranslations): PlayerWarningTranslations {
      return {
        ...emptyTranslations(),
        ...translations,
      };
    }

    function nextSortOrder(): number {
      const maxSortOrder = definitions.value.reduce((max, definition) => Math.max(max, definition.sortOrder || 0), 0);
      return maxSortOrder + 10;
    }

    function hasLocaleTranslation(locale: string): boolean {
      return !!editedTitle.value[locale]?.trim() && !!editedBody.value[locale]?.trim();
    }

    function translationCount(definition: PlayerWarningDefinition): number {
      return localeItems.filter((locale) =>
        !!definition.title[locale.value]?.trim() && !!definition.body[locale.value]?.trim()
      ).length;
    }

    function getTranslation(translations: PlayerWarningTranslations, locale: string): string {
      return translations[locale]?.trim()
        || translations.en?.trim()
        || Object.values(translations).find((value) => !!value?.trim())
        || "";
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

    function getErrorMessage(error: unknown): string {
      return error instanceof Error ? error.message : "Something went wrong.";
    }

    onMounted(loadDefinitions);

    return {
      definitions,
      loading,
      saving,
      showDisabled,
      errorMessage,
      dialogOpen,
      editedDefinitionId,
      editedSeverity,
      editedEnabled,
      editedSortOrder,
      editedLocale,
      editedTitle,
      editedBody,
      headers,
      severityItems,
      localeItems,
      filledLocaleCount,
      canSave,
      mdiAlertCircleOutline,
      mdiDelete,
      mdiPencil,
      loadDefinitions,
      openCreateDialog,
      openEditDialog,
      closeDialog,
      saveDefinition,
      disableDefinition,
      hasLocaleTranslation,
      translationCount,
      getTranslation,
      severityColor,
      severityIcon,
    };
  },
});
</script>

<style scoped>
.template-locale-summary {
  line-height: 1.5;
}
</style>
