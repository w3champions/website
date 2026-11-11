<template>
  <v-dialog
    :model-value="modelValue"
    :persistent="store.acting"
    max-width="600px"
    scrollable
    :aria-label="title"
    @update:model-value="emit('update:modelValue', $event)"
    @after-leave="restoreFocus"
  >
    <v-card v-if="shown">
      <v-card-title class="pt-3">{{ title }}</v-card-title>
      <v-card-text>
        <div class="text-body-2 mb-3">{{ t(key("review_body")) }}</div>

        <v-btn-toggle v-model="decision" class="mb-4" divided variant="outlined" density="comfortable" role="group" :aria-label="t(key('decision_label'))">
          <v-btn
            v-for="d in reviewDecisions(shown.review)"
            :key="d"
            :value="d"
            :color="DECISION_COLORS[d]"
            :aria-pressed="decision === d ? 'true' : 'false'"
          >
            {{ t(key(`decision_${d}`)) }}
          </v-btn>
        </v-btn-toggle>

        <template v-if="decision === 'denied'">
          <div v-if="store.denyLoading" class="text-body-2 text-medium-emphasis mb-3" role="status">
            <v-progress-circular indeterminate size="16" width="2" class="mr-2" />{{ t(key("deny_loading")) }}
          </div>
          <v-alert v-else-if="store.denyError" type="error" variant="tonal" density="compact" class="mb-3">
            {{ t(key("deny_failed")) }} {{ errorText(store.denyError, tr) }}
            <template v-slot:append>
              <v-btn variant="text" size="small" @click="store.loadDenyPreview(shown.id)">{{ t(key("retry")) }}</v-btn>
            </template>
          </v-alert>
          <v-alert v-else-if="store.denyLinks !== null" type="warning" variant="tonal" density="compact" class="mb-3">
            <template v-if="store.denyLinks.length > 0 || store.denyLinksTruncated">
              <div v-if="!store.denyLinksTruncated" class="font-weight-bold">{{ countText("deny_links", store.denyLinks.length, tr) }}</div>
              <template v-else>
                <div v-if="store.denyEndedLinks !== null" class="font-weight-bold">{{ countText("deny_ended", store.denyEndedLinks, tr) }}</div>
                <div class="text-body-2" role="status">{{ t(key("deny_truncated")) }}</div>
              </template>
              <ul class="link-list text-body-2">
                <li v-for="l in store.denyLinks" :key="`${l.a}|${l.b}`">{{ l.a }} – {{ l.b }}</li>
              </ul>
            </template>
            <span v-else>{{ t(key("deny_none")) }}</span>
          </v-alert>
        </template>

        <v-textarea
          v-model="reason"
          :label="t(key(decision && reviewNeedsReason(decision) ? 'reason_required' : 'review_reason'))"
          auto-grow
          rows="2"
          variant="filled"
          color="primary"
          :counter="REASON_MAX_LENGTH"
          :maxlength="REASON_MAX_LENGTH"
        />

        <v-alert v-if="store.actionError" type="error" variant="tonal" density="compact" class="mt-3">
          {{ errorText(store.actionError, tr) }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="store.acting" @click="emit('update:modelValue', false)">
          {{ t("views_admin.cancel") }}
        </v-btn>
        <v-btn :color="decision ? DECISION_COLORS[decision] : 'primary'" variant="flat" :disabled="!canSave" :loading="store.acting" @click="save">
          {{ t(key("save_review")) }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, toRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { SmurfEventReview, SmurfEventSummary } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { useRestoreFocus } from "@/composables/useRestoreFocus";
import { REASON_MAX_LENGTH } from "@/store/admin/hardwareSmurfs/actions";
import { reviewDecisions, reviewNeedsReason } from "@/store/admin/smurfEvents/actions";
import { countText, errorText } from "@/store/admin/smurfEvents/labels";
import { useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";

const DECISION_COLORS: Record<SmurfEventReview, string> = { confirmed: "success", denied: "error", unreviewed: "primary" };

const props = defineProps<{
  modelValue: boolean;
  event: SmurfEventSummary | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  /** `applied` false: stored, but the links follow with the next stats run. */
  (e: "reviewed", applied: boolean): void;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});
const store = useSmurfEventsStore();
const restoreFocus = useRestoreFocus(toRef(props, "modelValue"));

const decision = ref<SmurfEventReview | null>(null);
const reason = ref("");
// The event the dialog was opened for: it stays while a write is pending, even if the page moves on.
const shown = ref<SmurfEventSummary | null>(props.event);
const title = computed(() => t(key("review_title"), { name: shown.value?.name ?? "" }));

// A deny is offered only once the moderator has seen which links it brings back and gave a reason.
const canSave = computed(() => {
  if (decision.value === null || store.acting) return false;
  if (reviewNeedsReason(decision.value) && reason.value.trim() === "") return false;
  return decision.value !== "denied" || (store.denyLinks !== null && !store.denyLoading);
});

async function save(): Promise<void> {
  const event = shown.value;
  if (!canSave.value || event === null || decision.value === null) return;
  const outcome = await store.review(event.id, decision.value, reason.value);
  if (outcome === null) return;
  emit("reviewed", outcome.applied);
  emit("update:modelValue", false);
}

watch(decision, (next) => {
  if (next === "denied" && shown.value) void store.loadDenyPreview(shown.value.id);
  else store.clearDenyPreview();
});

watch(() => props.modelValue, (open) => {
  if (!open) return;
  shown.value = props.event;
  decision.value = null;
  reason.value = "";
  store.clearDenyPreview();
  store.clearActionError();
}, { immediate: true });
</script>

<style scoped>
.link-list {
  max-height: 200px;
  overflow-y: auto;
  margin: 4px 0 0;
  padding-left: 20px;
}
</style>
