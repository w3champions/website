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
      :event="editTarget"
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
      :allocations-loading="allocationsStore.loading"
      :saving="eventsStore.saving"
      :error="dialogError"
      @move="moveEvent"
    />
    <event-suspend-dialog
      v-model="suspendDialogOpen"
      :event="target"
      :saving="eventsStore.saving"
      :error="dialogError"
      @suspend="suspendEvent"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, type WritableComputedRef } from "vue";
import EventDialog from "@/components/admin/commercial-events/EventDialog.vue";
import EventMoveDialog from "@/components/admin/commercial-events/EventMoveDialog.vue";
import EventSuspendDialog from "@/components/admin/commercial-events/EventSuspendDialog.vue";
import { useCommercialEventAllocationsStore } from "@/store/admin/commercialEvents/allocationsStore";
import { closesOnSave, toEventCreateRequest, toEventUpdateRequest, toSuspendRequest } from "@/store/admin/commercialEvents/eventDraft";
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
// Kept after closing, so the event dialog does not switch to its create title while it fades out.
const editTarget = ref<AdminEvent | null>(null);
const createAllocationId = ref("");

// Only creating and moving need the allocation list.
const dialogError = computed(() =>
  eventsStore.error || (mode.value === "create" || mode.value === "move" ? allocationsStore.loadError : "")
);

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

// The create and move dialogs offer the allocations: reload them on open (another admin may have ended or changed one),
// unless a load is already running.
function ensureAllocations(): void {
  if (!allocationsStore.loading) void allocationsStore.load();
}

function open(next: Mode, event: AdminEvent | null): void {
  eventsStore.error = "";
  target.value = event;
  if (next === "create" || next === "edit") editTarget.value = event;
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
  if (mode.value === "create") {
    if (closesOnSave(draft, null, new Date()) && !confirm(closeNowText)) return;
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
  if (closesOnSave(draft, original, new Date()) && !confirm(closeNowText)) return;
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

// The error is shared by the list and the detail page: one page's failure must not show on the other.
onMounted(() => {
  eventsStore.error = "";
});

/** Closes any open dialog, e.g. when the page shows another event. */
function reset(): void {
  mode.value = "none";
  eventsStore.error = "";
}

defineExpose({ openCreate, openEdit, openMove, openSuspend, close, lift, reset });
</script>
