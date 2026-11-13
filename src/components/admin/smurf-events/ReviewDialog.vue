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
            :aria-pressed="decision === d ? 'true' : 'false'"
          >
            {{ t(key(`decision_${d}`)) }}
          </v-btn>
        </v-btn-toggle>

        <template v-if="decision === 'denied'">
          <v-alert v-if="store.denyLinks !== null && !store.denyApplies && !store.denyLoading && !store.denyError" type="info" variant="tonal" density="compact" class="mb-3" role="status">
            {{ t(key("not_applying_preview")) }}
          </v-alert>
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

        <v-text-field
          v-model="name"
          :label="t(key(nameRequired ? 'review_name_required' : 'review_name'))"
          :hint="nameRequired && !nameChanged ? t(key('review_name_hint')) : undefined"
          :persistent-hint="nameRequired && !nameChanged"
          :error-messages="nameProblem ?? undefined"
          :counter="NAME_MAX_LENGTH"
          :maxlength="NAME_MAX_LENGTH"
          variant="underlined"
          color="primary"
          @keydown.enter="onEnter"
        />

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
          {{ manualEventErrorText(store.actionError, tr) }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="store.acting" @click="emit('update:modelValue', false)">
          {{ t("views_admin.cancel") }}
        </v-btn>
        <v-btn color="primary" variant="flat" :disabled="!canSave" :loading="store.acting" @click="save">
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
import { NAME_MAX_LENGTH } from "@/store/admin/smurfEvents/draft";
import { reviewDecisions, reviewNeedsReason } from "@/store/admin/smurfEvents/actions";
import { countText, errorText, manualEventErrorText } from "@/store/admin/smurfEvents/labels";
import { useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";

const props = defineProps<{
  modelValue: boolean;
  event: SmurfEventSummary | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  /** `applied` false: stored, but the links follow with the next stats run. `applies` false: smurf events do not change links at the moment. */
  (e: "reviewed", applied: boolean, applies: boolean): void;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});
const store = useSmurfEventsStore();
const restoreFocus = useRestoreFocus(toRef(props, "modelValue"));

// Clicking the chosen decision again clears the toggle, which then emits undefined: both mean "none chosen".
const decision = ref<SmurfEventReview | null | undefined>(null);
const reason = ref("");
const name = ref("");
// The event the dialog was opened for: it stays while a write is pending, even if the page moves on.
const shown = ref<SmurfEventSummary | null>(props.event);
const title = computed(() => t(key("review_title"), { name: shown.value?.name ?? "" }));

const trimmedName = computed(() => name.value.trim());
const nameChanged = computed(() => trimmedName.value !== shown.value?.name);
// Confirming needs a name a moderator chose: the generated one does not count. A deny or going back accepts it.
const nameRequired = computed(() => decision.value === "confirmed" && shown.value?.named === false);
// A stored name that is no longer valid must not block a review that leaves the name alone.
const nameProblem = computed(() => {
  if (!nameChanged.value && !nameRequired.value) return null;
  if (trimmedName.value === "") return t(key("problem_name"));
  if (trimmedName.value.length > NAME_MAX_LENGTH) return t(key("problem_name_long"), { max: NAME_MAX_LENGTH });
  return null;
});

// A deny is offered only once the moderator has seen which links it brings back and gave a reason.
const canSave = computed(() => {
  if (!decision.value || store.acting) return false;
  if (nameProblem.value !== null || (nameRequired.value && !nameChanged.value)) return false;
  if (reviewNeedsReason(decision.value) && reason.value.trim() === "") return false;
  return decision.value !== "denied" || (store.denyLinks !== null && !store.denyLoading);
});

/** Enter that confirms an IME candidate must not submit the form. */
function onEnter(event: KeyboardEvent): void {
  if (event.isComposing) return;
  void save();
}

async function save(): Promise<void> {
  const event = shown.value;
  if (!canSave.value || event === null || !decision.value) return;
  const outcome = await store.review(event.id, decision.value, reason.value, nameChanged.value ? trimmedName.value : undefined);
  if (outcome === null) return;
  emit("reviewed", outcome.applied, outcome.applies);
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
  name.value = props.event?.name ?? "";
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
