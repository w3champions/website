<template>
  <v-dialog :model-value="modelValue" :persistent="saving" max-width="640px" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="pt-3">
        {{ event ? "Edit event" : "Create event" }}
      </v-card-title>

      <v-card-text>
        <v-select
          v-if="!event"
          v-model="draft.allocationId"
          label="Allocation"
          :items="allocationItems"
          item-title="title"
          item-value="value"
          variant="underlined"
          color="primary"
        />
        <div v-else class="text-body-2 mb-2">
          Allocation: {{ event.allocationName }} (use Move to change it)
        </div>
        <v-text-field
          v-model="draft.name"
          label="Name"
          :counter="EVENT_NAME_MAX_LENGTH"
          variant="underlined"
          color="primary"
        />
        <v-select
          v-model="draft.kind"
          label="Type"
          :items="KIND_OPTIONS"
          item-title="title"
          item-value="value"
          variant="underlined"
          color="primary"
        />
        <v-text-field
          v-model="draft.prizePoolUsd"
          label="Prize pool (US$)"
          type="number"
          min="0"
          :max="PRIZE_POOL_MAX_USD"
          variant="underlined"
          color="primary"
        />
        <v-text-field
          v-model="draft.startsAt"
          label="Start (UTC)"
          type="datetime-local"
          :hint="localTimeHint(draft.startsAt)"
          persistent-hint
          variant="underlined"
          color="primary"
        />
        <v-text-field
          v-model="draft.endsAt"
          class="mt-2"
          label="End (UTC)"
          type="datetime-local"
          :hint="localTimeHint(draft.endsAt)"
          persistent-hint
          variant="underlined"
          color="primary"
        />
        <v-text-field
          v-model="draft.maxGames"
          class="mt-2"
          label="Game limit"
          type="number"
          min="1"
          :max="MAX_GAMES_MAX"
          :hint="event ? `Used or in progress: ${used}` : ''"
          persistent-hint
          variant="underlined"
          color="primary"
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

        <v-alert v-if="endsNow" type="warning" variant="tonal" density="compact" class="mt-2">
          The end is not in the future: saving closes the event at once, and closed events can't be edited or reopened.
        </v-alert>
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
          @click="emit('save', { ...draft })"
        >
          {{ event ? "Save" : "Create" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from "vue";
import { localTimeHint } from "@/store/admin/commercialEvents/dates";
import {
  closesImmediately,
  draftFromEvent,
  emptyEventDraft,
  EVENT_NAME_MAX_LENGTH,
  MAX_GAMES_MAX,
  PRIZE_POOL_MAX_USD,
  validateEventDraft,
} from "@/store/admin/commercialEvents/eventDraft";
import type { EventDraft } from "@/store/admin/commercialEvents/eventDraft";
import { allocationOptionLabel, KIND_OPTIONS } from "@/store/admin/commercialEvents/format";
import type { AdminEvent, Allocation } from "@/store/admin/commercialEvents/types";
import { ADMIN_NOTE_MAX_LENGTH } from "@/store/admin/commercialEvents/validation";

const props = defineProps<{
  modelValue: boolean;
  event: AdminEvent | null;
  allocations: Allocation[];
  initialAllocationId: string;
  saving: boolean;
  error: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "save", draft: EventDraft): void;
}>();

const openedAt = ref(new Date());
const draft = reactive<EventDraft>(emptyEventDraft(openedAt.value));

const used = computed(() => (props.event ? props.event.consumed + props.event.held : 0));
const problem = computed(() => validateEventDraft(draft, used.value));
const endsNow = computed(() => closesImmediately(draft, openedAt.value));
const allocationItems = computed(() => props.allocations.map((a) => ({ title: allocationOptionLabel(a), value: a.id })));

watch(() => props.modelValue, (open) => {
  if (!open) return;
  openedAt.value = new Date();
  Object.assign(draft, props.event ? draftFromEvent(props.event) : emptyEventDraft(openedAt.value, props.initialAllocationId));
});
</script>
