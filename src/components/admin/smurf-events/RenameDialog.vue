<template>
  <v-dialog
    :model-value="modelValue"
    :persistent="store.acting"
    max-width="520px"
    :aria-label="title"
    @update:model-value="emit('update:modelValue', $event)"
    @after-leave="restoreFocus"
  >
    <v-card v-if="shown">
      <v-card-title class="pt-3">{{ title }}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="name"
          :label="t(key('field_name'))"
          :counter="NAME_MAX_LENGTH"
          :maxlength="NAME_MAX_LENGTH"
          :error-messages="problemText ?? undefined"
          variant="underlined"
          color="primary"
          autofocus
          @keydown.enter="save"
        />
        <v-textarea
          v-model="reason"
          :label="t(key('rename_reason'))"
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
        <v-btn variant="text" :disabled="store.acting" @click="emit('update:modelValue', false)">{{ t("views_admin.cancel") }}</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!canSave" :loading="store.acting" @click="save">{{ t(key("rename_save")) }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, toRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { SmurfEventSummary } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { useRestoreFocus } from "@/composables/useRestoreFocus";
import { REASON_MAX_LENGTH } from "@/store/admin/hardwareSmurfs/actions";
import { NAME_MAX_LENGTH } from "@/store/admin/smurfEvents/draft";
import { errorText } from "@/store/admin/smurfEvents/labels";
import { useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";

const props = defineProps<{
  modelValue: boolean;
  event: SmurfEventSummary | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "renamed"): void;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});
const store = useSmurfEventsStore();
const restoreFocus = useRestoreFocus(toRef(props, "modelValue"));

const name = ref("");
const reason = ref("");
// The event the dialog was opened for: it stays while a write is pending, even if the page moves on.
const shown = ref<SmurfEventSummary | null>(props.event);
const title = computed(() => t(key("rename_title"), { name: shown.value?.name ?? "" }));

const trimmed = computed(() => name.value.trim());
const problemText = computed(() => {
  if (trimmed.value === "") return t(key("problem_name"));
  if (trimmed.value.length > NAME_MAX_LENGTH) return t(key("problem_name_long"), { max: NAME_MAX_LENGTH });
  return null;
});
const canSave = computed(() => !store.acting && problemText.value === null && trimmed.value !== shown.value?.name);

async function save(): Promise<void> {
  const event = shown.value;
  if (!canSave.value || event === null) return;
  const renamed = await store.rename(event.id, trimmed.value, reason.value);
  if (renamed === null) return;
  emit("renamed");
  emit("update:modelValue", false);
}

watch(() => props.modelValue, (open) => {
  if (!open) return;
  shown.value = props.event;
  name.value = props.event?.name ?? "";
  reason.value = "";
  store.clearActionError();
}, { immediate: true });
</script>
