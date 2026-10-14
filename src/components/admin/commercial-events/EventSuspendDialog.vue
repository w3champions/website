<template>
  <v-dialog :model-value="modelValue" :persistent="saving" max-width="560px" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="pt-3">
        Suspend event
      </v-card-title>
      <v-card-text>
        <div class="text-body-2 mb-2">
          "{{ event?.name }}" stays suspended until you lift the suspension. No new event game can start meanwhile.
        </div>
        <v-textarea
          v-model="draft.suspensionMessage"
          label="Message to the event's organizers, delegates and authorized hosts"
          auto-grow
          rows="3"
          variant="filled"
          color="primary"
          :counter="SUSPENSION_MESSAGE_MAX_LENGTH"
        />
        <v-textarea
          v-model="draft.adminNote"
          class="mt-2"
          label="Admin note (admins only)"
          auto-grow
          rows="2"
          variant="filled"
          color="primary"
          :counter="ADMIN_NOTE_MAX_LENGTH"
        />
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-4">
          {{ error }}
        </v-alert>
        <v-alert v-if="problem" type="warning" variant="tonal" density="compact" class="mt-4">
          {{ problem }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="emit('update:modelValue', false)">
          Cancel
        </v-btn>
        <v-btn
          class="bg-primary text-w3-race-bg"
          variant="text"
          :disabled="problem !== null"
          :loading="saving"
          @click="emit('suspend', { ...draft })"
        >
          Suspend
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, watch } from "vue";
import { SUSPENSION_MESSAGE_MAX_LENGTH, suspendDraftFor, validateSuspendDraft } from "@/store/admin/commercialEvents/eventDraft";
import type { SuspendDraft } from "@/store/admin/commercialEvents/eventDraft";
import type { AdminEvent } from "@/store/admin/commercialEvents/types";
import { ADMIN_NOTE_MAX_LENGTH } from "@/store/admin/commercialEvents/validation";

const props = defineProps<{
  modelValue: boolean;
  event: AdminEvent | null;
  saving: boolean;
  error: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "suspend", draft: SuspendDraft): void;
}>();

const draft = reactive<SuspendDraft>({ suspensionMessage: "", adminNote: "" });
const problem = computed(() => validateSuspendDraft(draft));

watch(() => props.modelValue, (open) => {
  if (open && props.event) Object.assign(draft, suspendDraftFor(props.event));
});
</script>
