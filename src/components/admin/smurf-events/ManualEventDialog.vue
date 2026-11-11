<template>
  <v-dialog
    :model-value="modelValue"
    :persistent="store.acting"
    max-width="760px"
    scrollable
    :aria-label="title"
    @update:model-value="emit('update:modelValue', $event)"
    @after-leave="restoreFocus"
  >
    <v-card>
      <v-card-title class="pt-3">{{ title }}</v-card-title>
      <v-card-text>
        <div class="text-body-2 text-medium-emphasis mb-4">{{ t(key("manual_body")) }}</div>

        <v-text-field
          v-model="draft.name"
          :label="t(key('field_name'))"
          :counter="NAME_MAX_LENGTH"
          :maxlength="NAME_MAX_LENGTH"
          variant="underlined"
          color="primary"
          autofocus
        />
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="draft.from"
              :label="t(key('field_from'))"
              type="datetime-local"
              :hint="localTimeHint(draft.from)"
              persistent-hint
              variant="underlined"
              color="primary"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="draft.to"
              :label="t(key('field_to'))"
              type="datetime-local"
              :hint="localTimeHint(draft.to)"
              persistent-hint
              variant="underlined"
              color="primary"
            />
          </v-col>
        </v-row>
        <v-combobox
          v-model="draft.anchors"
          class="mt-2"
          :label="t(key('field_anchors'))"
          :hint="t(key('field_anchors_hint'))"
          persistent-hint
          multiple
          chips
          closable-chips
          :items="[]"
          hide-no-data
          variant="underlined"
          color="primary"
        />
        <v-textarea
          v-model="draft.reason"
          class="mt-2"
          :label="t(key('field_reason'))"
          auto-grow
          rows="2"
          variant="filled"
          color="primary"
          :counter="REASON_MAX_LENGTH"
          :maxlength="REASON_MAX_LENGTH"
        />

        <div v-if="shownProblem" class="text-caption text-warning mb-2" role="status">{{ t(key(shownProblem.name), shownProblem.named ?? {}) }}</div>

        <section class="preview-panel" :class="{ 'preview-panel--refused': store.preview?.refused }" :aria-label="t(key('preview_title'))">
          <div class="d-flex align-center mb-2">
            <span class="text-subtitle-2 font-weight-bold">{{ t(key("preview_title")) }}</span>
            <v-spacer />
            <v-btn
              variant="tonal"
              color="primary"
              size="small"
              :prepend-icon="mdiMagnify"
              :disabled="problem !== null || store.acting"
              :loading="store.previewLoading"
              @click="store.runPreview(draft, event?.id ?? null)"
            >
              {{ t(key("preview")) }}
            </v-btn>
          </div>

          <v-alert v-if="store.previewError" type="error" variant="tonal" density="compact" class="mb-2">
            {{ t(key("preview_failed")) }} {{ manualEventErrorText(store.previewError, tr) }}
          </v-alert>

          <template v-if="store.preview">
            <v-alert v-if="store.preview.refused" type="error" variant="tonal" density="compact" class="mb-3">
              {{ refusalLabel(store.preview.refused, tr) }}
            </v-alert>
            <v-alert v-if="store.preview.applies === false" type="info" variant="tonal" density="compact" class="mb-3" role="status">
              {{ t(key("not_applying_preview")) }}
            </v-alert>
            <div class="text-body-2">
              {{ store.preview.span ? t(key("preview_span"), { span: spanText(store.preview.span) }) : t(key("preview_no_span")) }}
            </div>
            <div class="text-body-2 mb-2">{{ previewCountsText(store.preview.counts, tr) }}</div>

            <div v-if="store.preview.networks.length > 0" class="mb-2">
              <div class="text-caption text-medium-emphasis">{{ t(key("preview_networks")) }}</div>
              <v-chip
                v-for="n in store.preview.networks"
                :key="n.hash8"
                size="small"
                variant="tonal"
                color="primary"
                class="mr-1 my-1"
              >
                <span class="font-monospace mr-2">{{ n.hash8 }}</span>
                {{ countText("preview_anchors", n.anchors, tr) }}
              </v-chip>
            </div>
            <div v-if="store.preview.excluded.length > 0" class="mb-2">
              <div class="text-caption text-medium-emphasis">{{ t(key("preview_excluded")) }}</div>
              <v-chip v-for="x in store.preview.excluded" :key="x.hash8" size="small" variant="outlined" class="mr-1 my-1">
                <span class="font-monospace mr-2">{{ x.hash8 }}</span>
                {{ exclusionLabel(x.reason, tr) }}
              </v-chip>
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ store.preview.endsLinks.length > 0 ? countText("preview_ends_links", store.preview.endsLinks.length, tr) : t(key("preview_ends_none")) }}
            </div>
            <ul v-if="store.preview.endsLinks.length > 0" class="link-list text-body-2">
              <li v-for="l in store.preview.endsLinks" :key="`${l.a}|${l.b}`">{{ l.a }} – {{ l.b }}</li>
            </ul>
          </template>
        </section>

        <div v-if="blocker && blocker !== 'invalid'" class="text-caption text-medium-emphasis mt-2" role="status">{{ t(key(`blocker_${blocker}`)) }}</div>

        <v-alert v-if="store.actionError" type="error" variant="tonal" density="compact" class="mt-3">
          {{ manualEventErrorText(store.actionError, tr) }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="store.acting" @click="emit('update:modelValue', false)">
          {{ t("views_admin.cancel") }}
        </v-btn>
        <v-btn color="primary" variant="flat" :disabled="!canSave" :loading="store.acting" @click="save">
          {{ t(key("save")) }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, toRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { mdiMagnify } from "@mdi/js";
import { useRestoreFocus } from "@/composables/useRestoreFocus";
import { formatUtc, localTimeHint } from "@/helpers/utc-dates";
import type { SmurfEventDetail } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { REASON_MAX_LENGTH } from "@/store/admin/hardwareSmurfs/actions";
import { draftFromEvent, draftProblem, emptyDraft, NAME_MAX_LENGTH, saveBlocker, type SmurfEventDraft } from "@/store/admin/smurfEvents/draft";
import { countText, exclusionLabel, manualEventErrorText, previewCountsText, refusalLabel } from "@/store/admin/smurfEvents/labels";
import { useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";

const props = defineProps<{
  modelValue: boolean;
  /** The manual event to edit; null to create one. */
  event: SmurfEventDetail | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  /**
   * `applied` false: stored, but the links follow with the next stats run. `applies` false: smurf events do not
   * change links at the moment, so the write changed none. `existing`: a create answered
   * an event that was already there, unchanged. `needsReview`: an edit took a confirmed event back to unreviewed.
   */
  (e: "saved", event: SmurfEventDetail, flags: { applied: boolean; applies: boolean; existing: boolean; needsReview: boolean }): void;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});
const store = useSmurfEventsStore();

const restoreFocus = useRestoreFocus(toRef(props, "modelValue"));

const draft = ref<SmurfEventDraft>(emptyDraft(new Date()));
// What the dialog opened with: a problem is shown only once the moderator changed something.
const opened = ref("");
const title = computed(() => t(key(props.event ? "edit_title" : "create_title")));
const problem = computed(() => draftProblem(draft.value));
const shownProblem = computed(() => (JSON.stringify(draft.value) === opened.value ? null : problem.value));
const blocker = computed(() => saveBlocker(draft.value, { preview: store.preview, key: store.previewKey, loading: store.previewLoading }));
const canSave = computed(() => blocker.value === null && !store.acting);

function spanText(span: { from: string; to: string }): string {
  return t(key("span"), { from: formatUtc(span.from), to: formatUtc(span.to) });
}

async function save(): Promise<void> {
  if (!canSave.value) return;
  const wasConfirmed = props.event?.review === "confirmed";
  const outcome = await store.saveManual(draft.value, props.event?.id ?? null);
  if (outcome === null) return;
  emit("saved", outcome.detail, { applied: outcome.applied, applies: outcome.applies, existing: outcome.existing, needsReview: wasConfirmed && outcome.detail.review === "unreviewed" });
  emit("update:modelValue", false);
}

watch(() => props.modelValue, (open) => {
  if (!open) return;
  draft.value = props.event ? draftFromEvent(props.event) : emptyDraft(new Date());
  opened.value = JSON.stringify(draft.value);
  store.resetPreview();
  store.clearActionError();
}, { immediate: true });
</script>

<style scoped>
.preview-panel {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-left: 3px solid rgb(var(--v-theme-primary));
  border-radius: 4px;
  padding: 12px 16px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.preview-panel--refused {
  border-left-color: rgb(var(--v-theme-error));
}

.link-list {
  max-height: 160px;
  overflow-y: auto;
  margin: 4px 0 0;
  padding-left: 20px;
}
</style>
