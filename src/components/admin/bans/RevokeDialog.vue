<template>
  <v-dialog
    :model-value="modelValue"
    max-width="560"
    :persistent="store.acting"
    :aria-label="t(key('revoke_title'))"
    @update:model-value="emit('update:modelValue', $event)"
    @after-leave="restoreFocus"
  >
    <v-form @submit.prevent="submit">
      <v-card>
        <v-card-title class="pt-3">{{ t(key("revoke_title")) }}</v-card-title>
        <v-card-text v-if="ban">
          <div class="revoke-ban-line mb-2">{{ banLine }}</div>
          <div v-if="ban.banReason" class="revoke-reason text-body-2 text-medium-emphasis mb-4">{{ ban.banReason }}</div>

          <v-progress-linear v-if="dialogStore.contextLoading" indeterminate class="mb-4" />
          <v-alert v-if="dialogStore.contextError" type="error" variant="tonal" density="compact" class="revoke-context-error mb-4">
            {{ banErrorText(dialogStore.contextError, tr) }}
          </v-alert>
          <v-alert v-else-if="dialogStore.account" type="info" variant="tonal" density="compact" class="revoke-remaining mb-4">
            {{ remainingAfterRevokeText(dialogStore.account, ban.id, format()) }}
          </v-alert>
          <div v-if="machineIdCount !== null" class="revoke-machine text-body-2 mb-4">
            {{ countText("revoke_machine", machineIdCount, tr) }}
          </div>

          <v-text-field
            v-model="note"
            class="revoke-note"
            :label="t(key('revoke_note'))"
            :counter="NOTE_MAX"
            :hint="machineIdCount !== null ? t(key('revoke_note_hint')) : undefined"
            :persistent-hint="machineIdCount !== null"
            :error-messages="noteProblemText"
            variant="filled"
            color="primary"
            autofocus
          />
        </v-card-text>
        <v-alert v-if="errorText" type="error" variant="tonal" density="compact" class="revoke-dialog-error mx-4 mb-2">{{ errorText }}</v-alert>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="store.acting" @click="emit('update:modelValue', false)">
            {{ t("views_admin.cancel") }}
          </v-btn>
          <v-btn type="submit" color="error" variant="flat" :disabled="confirmDisabled" :loading="store.acting">
            {{ t(key("revoke_confirm")) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, toRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useBanFormat } from "@/composables/useBanFormat";
import { useBanPermissions } from "@/composables/useBanPermissions";
import { useRestoreFocus } from "@/composables/useRestoreFocus";
import { NOTE_MAX, problemText, revokeNoteProblem } from "@/store/admin/bans/banForm";
import { useBanDialogStore } from "@/store/admin/bans/dialogStore";
import { banErrorText, blocksRetry } from "@/store/admin/bans/errors";
import { remainingAfterRevokeText } from "@/store/admin/bans/inEffect";
import { useBansStore } from "@/store/admin/bans/store";
import { countText, key } from "@/store/admin/bans/translate";
import type { BanView } from "@/store/admin/bans/types";
import { bannedAsText, endsText, modesText } from "@/store/admin/bans/wording";

const props = defineProps<{ modelValue: boolean; ban: BanView | null }>();
const emit = defineEmits<{
  (e: "update:modelValue", open: boolean): void;
  (e: "revoked", ban: BanView): void;
}>();

const { t } = useI18n();
const { tr, modeName, format } = useBanFormat();
const { hasMachineAccess } = useBanPermissions();
const store = useBansStore();
const dialogStore = useBanDialogStore();
const restoreFocus = useRestoreFocus(toRef(props, "modelValue"));

const note = ref("");

const banLine = computed(() =>
  props.ban ? [bannedAsText(props.ban, tr), modesText(props.ban.gameModes, modeName, tr), endsText(props.ban, tr)].join(" · ") : ""
);
/** Only an admin sees the machine part; a moderator's dialog never depends on ban.machine. */
const machineIdCount = computed(() => (hasMachineAccess.value && props.ban?.machine ? props.ban.machine.machineIds.length : null));
const blocked = computed(() => store.actionError !== null && blocksRetry(store.actionError));
const noteProblem = computed(() => revokeNoteProblem(note.value));
/** Why Revoke stays disabled, once something was typed: an untouched empty field needs no message. */
const noteProblemText = computed(() => (note.value !== "" && noteProblem.value !== null ? problemText(noteProblem.value, tr) : ""));
const confirmDisabled = computed(() => store.acting || blocked.value || noteProblem.value !== null);
const errorText = computed(() => {
  if (store.actionError === null) return "";
  return store.maybeSaved ? t(key("error_maybe_saved")) : banErrorText(store.actionError, tr);
});

async function submit(): Promise<void> {
  if (confirmDisabled.value || !props.ban) return;
  const revoked = await store.revoke(props.ban.id, note.value.trim());
  if (revoked === null) return;
  emit("revoked", revoked);
  emit("update:modelValue", false);
}

function reset(): void {
  note.value = "";
  dialogStore.clear();
  store.clearActionError();
  // The revoke dialog never loads machine IDs: it only needs what remains in effect.
  if (props.ban) void dialogStore.open(props.ban.accountKey, { machineAccess: false });
}

watch(() => props.modelValue, (open) => {
  if (open) {
    reset();
  } else {
    dialogStore.clear();
    store.clearActionError();
  }
}, { immediate: true });

// Another ban handed to a dialog that stays open starts from scratch.
watch(() => props.ban?.id, () => {
  if (props.modelValue) reset();
});
</script>

<style scoped>
.revoke-reason {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  overflow-wrap: anywhere;
}
</style>
