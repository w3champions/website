<template>
  <v-dialog :model-value="modelValue" :persistent="saving" max-width="520px" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="pt-3">
        Move event
      </v-card-title>
      <v-card-text>
        <div class="text-body-2 mb-2">
          "{{ event?.name }}" is on {{ event?.allocationName }}. Its organizers are the members of the allocation it is on.
        </div>
        <v-select
          v-model="allocationId"
          label="Target allocation"
          :items="targets"
          item-title="title"
          item-value="value"
          :loading="allocationsLoading"
          :hide-no-data="allocationsLoading"
          no-data-text="No other allocation."
          variant="underlined"
          color="primary"
        />
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-4">
          {{ error }}
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
          :disabled="allocationId === ''"
          :loading="saving"
          @click="emit('move', allocationId)"
        >
          Move
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { moveTargets } from "@/store/admin/commercialEvents/eventDraft";
import { allocationOptionLabel } from "@/store/admin/commercialEvents/format";
import type { AdminEvent, Allocation } from "@/store/admin/commercialEvents/types";

const props = defineProps<{
  modelValue: boolean;
  event: AdminEvent | null;
  allocations: Allocation[];
  allocationsLoading: boolean;
  saving: boolean;
  error: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "move", allocationId: string): void;
}>();

const allocationId = ref("");
const targets = computed(() =>
  moveTargets(props.allocations, props.event?.allocationId ?? "").map((a) => ({ title: allocationOptionLabel(a), value: a.id }))
);

watch(() => props.modelValue, (open) => {
  if (open) allocationId.value = "";
});
</script>
