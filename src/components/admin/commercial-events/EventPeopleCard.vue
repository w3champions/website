<template>
  <v-card variant="outlined">
    <v-card-title class="text-subtitle-1">People</v-card-title>
    <v-card-text>
      <div class="text-subtitle-2">Organizers</div>
      <div class="text-caption text-medium-emphasis mb-1">
        The members of the event's allocation. Change them on the Allocations page.
      </div>
      <div class="mb-3">
        <v-chip v-for="tag in event.organizers" :key="tag" size="small" class="mr-1 mb-1">{{ tag }}</v-chip>
        <span v-if="event.organizers.length === 0" class="text-medium-emphasis">None.</span>
      </div>

      <template v-for="group in groups" :key="group.role">
        <div class="text-subtitle-2">{{ group.title }}</div>
        <v-table density="compact" class="mb-3">
          <tbody>
            <tr v-for="entry in group.entries" :key="entry.battleTag">
              <td>{{ entry.battleTag }}</td>
              <td class="text-caption text-medium-emphasis">added by {{ entry.addedBy }}, {{ formatUtc(entry.addedAt) }}</td>
              <td class="text-right">
                <v-btn
                  v-if="canManage"
                  icon
                  variant="text"
                  size="small"
                  :title="`Remove ${group.singular}`"
                  :aria-label="`Remove ${entry.battleTag}`"
                  :disabled="busy"
                  @click="remove(entry.battleTag, group.singular)"
                >
                  <v-icon size="small">{{ mdiDelete }}</v-icon>
                </v-btn>
              </td>
            </tr>
            <tr v-if="group.entries.length === 0">
              <td colspan="3" class="text-medium-emphasis">None.</td>
            </tr>
          </tbody>
        </v-table>
      </template>

      <template v-if="canManage">
        <div class="text-subtitle-2">Add a person</div>
        <div class="d-flex align-center flex-wrap">
          <v-select
            v-model="role"
            class="mr-2"
            style="max-width: 200px"
            label="Role"
            :items="ROLE_OPTIONS"
            item-title="title"
            item-value="value"
            variant="underlined"
            color="primary"
            hide-details
          />
          <battle-tag-picker v-model="battleTag" class="flex-grow-1" :reset-key="pickerKey" />
          <v-btn variant="text" :disabled="busy || problem !== null" @click="add">Add</v-btn>
        </div>
        <div v-if="battleTag !== '' && problem" class="text-caption text-warning">{{ problem }}</div>
        <div class="text-caption text-medium-emphasis">
          An account holds one role per event: delegate or authorized host.
        </div>
      </template>
      <div v-else class="text-caption text-medium-emphasis">People can't be changed on a closed event.</div>

      <v-alert v-if="store.error" type="error" variant="tonal" density="compact" class="mt-4" closable @click:close="store.error = ''">
        {{ store.error }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { mdiDelete } from "@mdi/js";
import BattleTagPicker from "@/components/admin/commercial-events/BattleTagPicker.vue";
import { formatUtc } from "@/store/admin/commercialEvents/dates";
import { useCommercialEventDetailStore } from "@/store/admin/commercialEvents/eventDetailStore";
import { eventActions, personProblem } from "@/store/admin/commercialEvents/eventDraft";
import { useCommercialEventsStore } from "@/store/admin/commercialEvents/eventsStore";
import { ROLE_OPTIONS } from "@/store/admin/commercialEvents/format";
import type { AdminEventDetail, ManagedRole } from "@/store/admin/commercialEvents/types";

const props = defineProps<{ event: AdminEventDetail }>();

const store = useCommercialEventDetailStore();
const eventsStore = useCommercialEventsStore();

const role = ref<ManagedRole>("delegate");
const battleTag = ref("");
const pickerKey = ref(0);

const canManage = computed(() => eventActions(props.event).managePeople);
// While the event reloads, its status (and so whether people may change) is not known; while an event write runs,
// its answer would replace the people.
const busy = computed(() => store.saving || store.loading || eventsStore.saving);
const problem = computed(() => personProblem(props.event, battleTag.value));
const groups = computed(() => [
  { role: "delegate", title: "Delegates", singular: "delegate", entries: props.event.delegates },
  { role: "host", title: "Authorized hosts", singular: "authorized host", entries: props.event.hosts },
]);

async function add(): Promise<void> {
  if (await store.addPerson(battleTag.value, role.value)) {
    battleTag.value = "";
    pickerKey.value++;
  }
}

async function remove(tag: string, singular: string): Promise<void> {
  if (!confirm(`Remove ${tag} as ${singular} of this event?`)) return;
  await store.removePerson(tag);
}
</script>
