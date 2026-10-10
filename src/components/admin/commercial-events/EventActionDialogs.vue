<template>
  <div>
    <v-alert
      v-if="eventsStore.error && mode === 'none'"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="eventsStore.error = ''"
    >
      {{ eventsStore.error }}
    </v-alert>

    <event-dialog
      v-model="eventDialogOpen"
      :event="mode === 'edit' ? target : null"
      :allocations="allocationsStore.allocations"
      :initial-allocation-id="createAllocationId"
      :saving="eventsStore.saving"
      :error="dialogError"
      @save="saveEvent"
    />
    <event-move-dialog
      v-model="moveDialogOpen"
      :event="target"
      :allocations="allocationsStore.allocations"
      :saving="eventsStore.saving"
      :error="dialogError"
      @move="moveEvent"
    />
    <event-suspend-dialog
      v-model="suspendDialogOpen"
      :event="target"
      :saving="eventsStore.saving"
      :error="eventsStore.error"
      @suspend="suspendEvent"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, type WritableComputedRef } from "vue";
import EventDialog from "@/components/admin/commercial-events/EventDialog.vue";
import EventMoveDialog from "@/components/admin/commercial-events/EventMoveDialog.vue";
import EventSuspendDialog from "@/components/admin/commercial-events/EventSuspendDialog.vue";
import { useCommercialEventAllocationsStore } from "@/store/admin/commercialEvents/allocationsStore";
import { closesImmediately, toEventCreateRequest, toEventUpdateRequest, toSuspendRequest } from "@/store/admin/commercialEvents/eventDraft";
import type { EventDraft, SuspendDraft } from "@/store/admin/commercialEvents/eventDraft";
import { useCommercialEventsStore } from "@/store/admin/commercialEvents/eventsStore";
import type { AdminEvent, AdminEventDetail } from "@/store/admin/commercialEvents/types";

type Mode = "none" | "create" | "edit" | "move" | "suspend";

const emit = defineEmits<{
  (e: "changed", event: AdminEventDetail): void;
}>();

const eventsStore = useCommercialEventsStore();
const allocationsStore = useCommercialEventAllocationsStore();

const mode = ref<Mode>("none");
const target = ref<AdminEvent | null>(null);
const createAllocationId = ref("");

const dialogError = computed(() => eventsStore.error || allocationsStore.loadError);

function dialogModel(...modes: Mode[]): WritableComputedRef<boolean> {
  return computed({
    get: () => modes.includes(mode.value),
    set: (open: boolean) => {
      if (!open) {
        mode.value = "none";
        eventsStore.error = "";
      }
    },
  });
}

const eventDialogOpen = dialogModel("create", "edit");
const moveDialogOpen = dialogModel("move");
const suspendDialogOpen = dialogModel("suspend");

function ensureAllocations(): void {
  if (allocationsStore.allocations.length === 0 && !allocationsStore.loading) void allocationsStore.load();
}

function open(next: Mode, event: AdminEvent | null): void {
  eventsStore.error = "";
  target.value = event;
  mode.value = next;
}

function finish(event: AdminEventDetail): void {
  mode.value = "none";
  emit("changed", event);
}

function openCreate(allocationId = ""): void {
  ensureAllocations();
  createAllocationId.value = allocationId;
  open("create", null);
}

function openEdit(event: AdminEvent): void {
  open("edit", event);
}

function openMove(event: AdminEvent): void {
  ensureAllocations();
  open("move", event);
}

function openSuspend(event: AdminEvent): void {
  open("suspend", event);
}

const closeNowText = "The end is not in the future, so this closes the event now. Closed events can't be edited or reopened. Continue?";

async function saveEvent(draft: EventDraft): Promise<void> {
  const endsNow = closesImmediately(draft, new Date());
  if (mode.value === "create") {
    if (endsNow && !confirm(closeNowText)) return;
    const created = await eventsStore.create(toEventCreateRequest(draft));
    if (created) finish(created);
    return;
  }
  const original = target.value;
  if (original === null) return;
  const request = toEventUpdateRequest(draft, original);
  if (Object.keys(request).length === 0) {
    mode.value = "none";
    return;
  }
  if (request.endsAt !== undefined && endsNow && !confirm(closeNowText)) return;
  const updated = await eventsStore.update(original.id, request);
  if (updated) finish(updated);
}

async function moveEvent(allocationId: string): Promise<void> {
  if (target.value === null) return;
  const moved = await eventsStore.move(target.value.id, allocationId);
  if (moved) finish(moved);
}

async function suspendEvent(draft: SuspendDraft): Promise<void> {
  if (target.value === null) return;
  const suspended = await eventsStore.suspend(target.value.id, toSuspendRequest(draft, target.value));
  if (suspended) finish(suspended);
}

async function close(event: AdminEvent): Promise<void> {
  if (!confirm(`Close "${event.name}" now? Closed events can't be edited or reopened.`)) return;
  mode.value = "none";
  const closed = await eventsStore.close(event.id);
  if (closed) emit("changed", closed);
}

async function lift(event: AdminEvent): Promise<void> {
  if (!confirm(`Lift the suspension of "${event.name}"? Event games can start again.`)) return;
  mode.value = "none";
  const lifted = await eventsStore.unsuspend(event.id);
  if (lifted) emit("changed", lifted);
}

defineExpose({ openCreate, openEdit, openMove, openSuspend, close, lift });
</script>
