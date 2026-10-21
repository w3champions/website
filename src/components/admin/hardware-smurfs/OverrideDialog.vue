<template>
  <v-dialog
    :model-value="modelValue"
    :persistent="saving"
    max-width="600px"
    :aria-label="copy?.title"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card v-if="copy">
      <v-form @submit.prevent="submit">
        <v-card-title class="pt-3 d-flex align-center">
          <v-icon v-if="copy.tone !== 'primary'" :color="copy.tone" class="mr-2" :icon="mdiAlertOutline" />
          {{ copy.title }}
        </v-card-title>
        <v-card-text>
          <div class="text-body-2 mb-3">{{ copy.body }}</div>

          <v-alert v-if="copy.replaceNotice" type="info" variant="tonal" density="compact" class="mb-3">
            {{ copy.replaceNotice }}
          </v-alert>

          <v-alert v-if="copy.warning" :type="copy.tone === 'error' ? 'error' : 'warning'" variant="tonal" class="mb-3">
            <div class="font-weight-bold">{{ copy.warning }}</div>
            <div class="mt-1">
              <span v-if="holdersLoading">{{ t(key("holders_loading")) }}</span>
              <span v-else-if="copy.holders" class="text-subtitle-1 font-weight-bold">{{ copy.holders }}</span>
            </div>
          </v-alert>
          <v-alert v-if="holdersError" type="error" variant="tonal" density="compact" class="mb-3">
            {{ t(key("holders_failed")) }} {{ holdersError }}
            <template v-slot:append>
              <v-btn variant="text" size="small" @click="emit('retryHolders')">{{ t(key("refresh")) }}</v-btn>
            </template>
          </v-alert>

          <v-textarea
            v-if="copy.needsReason"
            v-model="reason"
            :label="t(key('reason_label'))"
            auto-grow
            rows="2"
            variant="filled"
            color="primary"
            autofocus
            :counter="REASON_MAX_LENGTH"
            :maxlength="REASON_MAX_LENGTH"
          />
          <div v-else class="text-caption text-medium-emphasis">{{ t(key("revoke_note")) }}</div>

          <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">
            {{ error }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="saving" @click="emit('update:modelValue', false)">
            {{ t("views_admin.cancel") }}
          </v-btn>
          <v-btn
            type="submit"
            :color="copy.tone"
            variant="flat"
            :disabled="!canSubmit"
            :loading="saving"
          >
            {{ copy.confirmLabel }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { mdiAlertOutline } from "@mdi/js";
import type { DialogCopy } from "@/store/admin/hardwareSmurfs/dialogCopy";
import { key } from "@/store/admin/hardwareSmurfs/translate";

/** The server refuses longer reasons. */
const REASON_MAX_LENGTH = 1000;

const props = defineProps<{
  modelValue: boolean;
  copy: DialogCopy | null;
  saving: boolean;
  error: string;
  /** Wide-impact actions: the holder count is still loading or failed; confirming waits for it. */
  holdersLoading: boolean;
  holdersError: string;
  /** False while the dialog lacks something it must show first (the holder count). */
  ready: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm", reason: string): void;
  (e: "retryHolders"): void;
}>();

const { t } = useI18n();
const reason = ref("");

const canSubmit = computed(() => props.ready && !props.saving && (!props.copy?.needsReason || reason.value.trim() !== ""));

function submit(): void {
  if (canSubmit.value) emit("confirm", reason.value);
}

watch(() => props.modelValue, (open) => {
  if (open) reason.value = "";
});
</script>
