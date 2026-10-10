<template>
  <v-dialog :model-value="modelValue" :persistent="saving" max-width="640px" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="pt-3">
        {{ allocation ? "Edit allocation" : "Create allocation" }}
      </v-card-title>

      <v-card-text>
        <v-text-field
          v-model="draft.name"
          label="Name"
          :counter="ALLOCATION_NAME_MAX_LENGTH"
          variant="underlined"
          color="primary"
        />
        <v-text-field
          v-model="draft.gamesPerPeriod"
          label="Games per period"
          type="number"
          min="1"
          :max="GAMES_PER_PERIOD_MAX"
          variant="underlined"
          color="primary"
        />
        <v-select
          v-model="draft.recurrence"
          label="Recurrence"
          :items="RECURRENCE_OPTIONS"
          item-title="title"
          item-value="value"
          :disabled="started"
          variant="underlined"
          color="primary"
        />
        <v-text-field
          v-model="draft.startsAt"
          label="Start (UTC)"
          type="datetime-local"
          :disabled="started"
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
        <div v-if="started" class="text-caption text-medium-emphasis mt-2">
          Start and recurrence can't be changed after the allocation has started. End it and create a new one instead.
        </div>
        <div class="text-caption text-medium-emphasis mt-2">
          Periods start at 00:00 UTC on the start date and repeat weekly or monthly from there. A games-per-period change applies to the current period at once.
        </div>
        <v-switch
          v-model="draft.allowEventCreation"
          class="mt-2"
          label="Members can create events from this allocation"
          color="primary"
          hide-details
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

        <div class="text-subtitle-2 mt-2">Members (organizers of every event on this allocation)</div>
        <template v-if="allocation">
          <v-table density="compact">
            <tbody>
              <tr v-for="member in allocation.members" :key="member.battleTag">
                <td>{{ member.battleTag }}</td>
                <td class="text-caption text-medium-emphasis">added by {{ member.addedBy }}, {{ formatUtc(member.addedAt) }}</td>
                <td class="text-right">
                  <v-btn
                    icon
                    variant="text"
                    size="small"
                    title="Remove member"
                    :aria-label="`Remove ${member.battleTag}`"
                    :disabled="saving"
                    @click="removeMember(member.battleTag)"
                  >
                    <v-icon size="small">{{ mdiDelete }}</v-icon>
                  </v-btn>
                </td>
              </tr>
              <tr v-if="allocation.members.length === 0">
                <td colspan="3" class="text-medium-emphasis">No members yet.</td>
              </tr>
            </tbody>
          </v-table>
          <div class="d-flex align-center">
            <battle-tag-picker v-model="memberToAdd" class="flex-grow-1" :reset-key="pickerKey" />
            <v-btn variant="text" :disabled="saving || memberProblemText !== null" @click="addMember">Add member</v-btn>
          </div>
          <div v-if="memberToAdd !== '' && memberProblemText" class="text-caption text-warning">{{ memberProblemText }}</div>
        </template>
        <div v-else class="text-caption text-medium-emphasis">Create the allocation first, then add its members here.</div>

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-4">
          {{ error }}
        </v-alert>
        <v-alert v-if="problem" type="warning" variant="tonal" density="compact" class="mt-4">
          {{ problem }}
        </v-alert>
        <v-alert v-if="startedNotice" type="warning" variant="tonal" density="compact" class="mt-4">
          This allocation has started meanwhile, so its start and recurrence can't be changed any more and were reset. Save again to keep your other changes.
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="emit('update:modelValue', false)">
          Close
        </v-btn>
        <v-btn
          class="bg-primary text-w3-race-bg"
          variant="text"
          :disabled="problem !== null"
          :loading="saving"
          @click="save"
        >
          {{ allocation ? "Save" : "Create" }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from "vue";
import { mdiDelete } from "@mdi/js";
import BattleTagPicker from "@/components/admin/commercial-events/BattleTagPicker.vue";
import {
  ALLOCATION_NAME_MAX_LENGTH,
  draftFromAllocation,
  emptyAllocationDraft,
  GAMES_PER_PERIOD_MAX,
  isAllocationStarted,
  memberProblem,
  revertStartedFields,
  validateAllocationDraft,
} from "@/store/admin/commercialEvents/allocationDraft";
import type { AllocationDraft } from "@/store/admin/commercialEvents/allocationDraft";
import { formatUtc, localTimeHint } from "@/store/admin/commercialEvents/dates";
import { RECURRENCE_OPTIONS } from "@/store/admin/commercialEvents/format";
import type { Allocation } from "@/store/admin/commercialEvents/types";
import { ADMIN_NOTE_MAX_LENGTH } from "@/store/admin/commercialEvents/validation";

const props = defineProps<{
  modelValue: boolean;
  allocation: Allocation | null;
  saving: boolean;
  error: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  /** `base` is the allocation the draft was built from (null when creating). */
  (e: "save", draft: AllocationDraft, base: Allocation | null): void;
  (e: "addMember", battleTag: string): void;
  (e: "removeMember", battleTag: string): void;
}>();

const openedAt = ref(new Date());
const draft = reactive<AllocationDraft>(emptyAllocationDraft(openedAt.value));
// The allocation the draft was built from: the update is computed against it, so a newer
// copy loaded while the dialog is open cannot turn untouched draft fields into changes.
const base = ref<Allocation | null>(null);
const startedNotice = ref(false);
const memberToAdd = ref("");
// Remounts the picker so a previous selection never lingers.
const pickerKey = ref(0);

const started = computed(() => base.value !== null && isAllocationStarted(base.value, openedAt.value));
const problem = computed(() => validateAllocationDraft(draft));
const memberProblemText = computed(() => memberProblem(props.allocation?.members ?? [], memberToAdd.value));

function reset(): void {
  openedAt.value = new Date();
  base.value = props.allocation ? { ...props.allocation } : null;
  Object.assign(draft, base.value ? draftFromAllocation(base.value) : emptyAllocationDraft(openedAt.value));
  startedNotice.value = false;
  memberToAdd.value = "";
  pickerKey.value++;
}

// Re-initialise on open, and when a just-created allocation turns the dialog into its editor.
watch(() => [props.modelValue, props.allocation?.id] as const, ([open, id], [wasOpen, previousId]) => {
  if (open && (!wasOpen || id !== previousId)) reset();
});

// Clear the picker once the added member is listed, so a failed add keeps the selection.
watch(() => props.allocation?.members, (members) => {
  if (memberToAdd.value !== "" && members?.some((member) => member.battleTag === memberToAdd.value)) {
    memberToAdd.value = "";
    pickerKey.value++;
  }
});

function save(): void {
  // Re-evaluates `started`, which locks start and recurrence from now on.
  openedAt.value = new Date();
  startedNotice.value = base.value !== null && revertStartedFields(draft, base.value, openedAt.value);
  if (!startedNotice.value) emit("save", { ...draft }, base.value);
}

function addMember(): void {
  emit("addMember", memberToAdd.value);
}

function removeMember(battleTag: string): void {
  if (confirm(`Remove ${battleTag} from this allocation? They lose access to every event on it.`)) {
    emit("removeMember", battleTag);
  }
}
</script>
