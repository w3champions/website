<template>
  <v-dialog
    :model-value="modelValue"
    :persistent="store.acting"
    max-width="560px"
    :aria-label="title"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card v-if="event">
      <v-card-title class="pt-3 d-flex align-center">
        <v-icon color="error" class="mr-2" :icon="mdiAlertOutline" />
        {{ title }}
      </v-card-title>
      <v-card-text>
        <div class="text-body-2 mb-3">{{ t(key("delete_body")) }}</div>
        <v-textarea
          v-model="reason"
          :label="t(key('reason_required'))"
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
        <v-btn color="error" variant="flat" :disabled="!canDelete" :loading="store.acting" @click="remove">
          {{ t(key("delete_confirm")) }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { mdiAlertOutline } from "@mdi/js";
import type { SmurfEventSummary } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { REASON_MAX_LENGTH } from "@/store/admin/hardwareSmurfs/actions";
import { errorText } from "@/store/admin/smurfEvents/labels";
import { useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";

const props = defineProps<{
  modelValue: boolean;
  event: SmurfEventSummary | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "deleted"): void;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});
const store = useSmurfEventsStore();
const reason = ref("");
const title = computed(() => t(key("delete_title"), { name: props.event?.name ?? "" }));
// The reason goes to the audit log, as for hardware overrides.
const canDelete = computed(() => !store.acting && reason.value.trim() !== "");

async function remove(): Promise<void> {
  const event = props.event;
  if (event === null || !canDelete.value) return;
  if (!(await store.deleteEvent(event.id, reason.value))) return;
  emit("deleted");
  emit("update:modelValue", false);
}

watch(() => props.modelValue, (open) => {
  if (!open) return;
  reason.value = "";
  store.actionError = null;
});
</script>
