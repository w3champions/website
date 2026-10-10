<template>
  <div>
    <v-card-title class="pt-3 d-flex align-center">
      <v-btn
        icon
        variant="text"
        size="small"
        title="Back to events"
        aria-label="Back to events"
        :to="{ name: EAdminRouteName.COMMERCIAL_EVENTS_EVENTS }"
      >
        <v-icon>{{ mdiArrowLeft }}</v-icon>
      </v-btn>
      <span class="ml-2">{{ store.event?.name ?? "Event" }}</span>
      <v-chip v-if="store.event" class="ml-3" size="small" variant="flat" :color="eventStatusColor(store.event)">
        {{ eventStatusLabel(store.event) }}
      </v-chip>
    </v-card-title>
    <v-container v-if="permissionsKnown && !hasPermission" class="w3-container-width">
      <v-alert type="warning" variant="tonal">
        You don't have the CommercialLicense permission.
      </v-alert>
    </v-container>
    <v-container v-else-if="hasPermission" class="w3-container-width">
      <v-alert v-if="store.loadError" type="error" variant="tonal" class="mb-4">
        {{ store.loadError }}
        <template v-slot:append>
          <v-btn variant="text" :disabled="store.loading" @click="store.loadEvent()">Retry</v-btn>
        </template>
      </v-alert>
      <v-progress-linear v-if="store.loading" indeterminate color="primary" class="mb-2" />

      <template v-if="store.event">
        <v-alert v-if="suspension" type="warning" variant="tonal" class="mb-4">
          {{ suspension }}
        </v-alert>

        <div class="d-flex flex-wrap mb-4">
          <v-btn v-if="actions.edit" class="mr-2 mb-2" variant="tonal" :prepend-icon="mdiPencil" :disabled="busy" @click="act('openEdit')">
            Edit
          </v-btn>
          <v-btn v-if="actions.move" class="mr-2 mb-2" variant="tonal" :prepend-icon="mdiSwapHorizontal" :disabled="busy" @click="act('openMove')">
            Move
          </v-btn>
          <v-btn v-if="actions.suspend" class="mr-2 mb-2" variant="tonal" :prepend-icon="mdiPauseCircleOutline" :disabled="busy" @click="act('openSuspend')">
            Suspend
          </v-btn>
          <v-btn v-if="actions.lift" class="mr-2 mb-2" variant="tonal" :prepend-icon="mdiPlayCircleOutline" :disabled="busy" @click="act('lift')">
            Lift suspension
          </v-btn>
          <v-btn v-if="actions.close" class="mr-2 mb-2" variant="tonal" :prepend-icon="mdiLock" :disabled="busy" @click="act('close')">
            Close now
          </v-btn>
          <v-spacer />
          <v-btn class="mb-2" variant="text" :prepend-icon="mdiRefresh" :disabled="store.loading" @click="refresh">
            Refresh
          </v-btn>
        </div>

        <event-action-dialogs ref="actionDialogsComponent" @changed="onChanged" />

        <v-card variant="outlined">
          <v-table density="compact">
            <tbody>
              <tr v-for="row in rows" :key="row.label">
                <th class="text-left" style="width: 220px">{{ row.label }}</th>
                <td>{{ row.value }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>

        <event-people-card class="mt-4" :event="store.event" @changed="onPeopleChanged" />
        <event-games-table class="mt-4" />
        <audit-log-table class="mt-4" />
      </template>
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, useTemplateRef, watch } from "vue";
import { mdiArrowLeft, mdiLock, mdiPauseCircleOutline, mdiPencil, mdiPlayCircleOutline, mdiRefresh, mdiSwapHorizontal } from "@mdi/js";
import AuditLogTable from "@/components/admin/commercial-events/AuditLogTable.vue";
import EventActionDialogs from "@/components/admin/commercial-events/EventActionDialogs.vue";
import EventGamesTable from "@/components/admin/commercial-events/EventGamesTable.vue";
import EventPeopleCard from "@/components/admin/commercial-events/EventPeopleCard.vue";
import { useCommercialLicensePermission } from "@/composables/useCommercialLicensePermission";
import { EAdminRouteName } from "@/router/types";
import { formatUtc } from "@/store/admin/commercialEvents/dates";
import { useCommercialEventDetailStore } from "@/store/admin/commercialEvents/eventDetailStore";
import { eventActions } from "@/store/admin/commercialEvents/eventDraft";
import { useCommercialEventsStore } from "@/store/admin/commercialEvents/eventsStore";
import { eventStatusColor, eventStatusLabel, eventUsedLabel, formatPrizePool, kindLabel, suspensionNotice } from "@/store/admin/commercialEvents/format";
import type { AdminEventDetail } from "@/store/admin/commercialEvents/types";

const props = defineProps<{ eventId: string }>();

const store = useCommercialEventDetailStore();
const eventsStore = useCommercialEventsStore();
const { hasPermission, permissionsKnown } = useCommercialLicensePermission();
const actionDialogs = useTemplateRef<InstanceType<typeof EventActionDialogs>>("actionDialogsComponent");

const busy = computed(() => store.loading || store.saving || eventsStore.saving);
const actions = computed(() => eventActions(store.event ?? { status: "closed" as const }));
const suspension = computed(() => (store.event ? suspensionNotice(store.event) : null));

const rows = computed(() => {
  const event = store.event;
  if (!event) return [];
  return [
    { label: "ID", value: event.id },
    { label: "Type", value: kindLabel(event.kind) },
    { label: "Prize pool", value: formatPrizePool(event.prizePoolUsd) },
    { label: "Start (UTC)", value: formatUtc(event.startsAt) },
    { label: "End (UTC)", value: formatUtc(event.endsAt) },
    { label: "Allocation", value: `${event.allocationName} (${event.allocationId})` },
    { label: "Used / limit", value: eventUsedLabel(event) },
    { label: "Counted", value: String(event.consumed) },
    { label: "In progress", value: String(event.held) },
    { label: "Not counted", value: String(event.invalid) },
    { label: "Created", value: `${event.createdBy} via ${event.createdVia}, ${formatUtc(event.createdAt)}` },
    { label: "Last changed", value: `${event.updatedBy}, ${formatUtc(event.updatedAt)}` },
    ...(event.closedAt ? [{ label: "Closed", value: `${event.closedBy ?? "—"}, ${formatUtc(event.closedAt)}` }] : []),
    { label: "Admin note", value: event.adminNote ?? "" },
  ];
});

type EventAction = "openEdit" | "openMove" | "openSuspend" | "lift" | "close";

// Template click handlers are callbacks, where `v-if="store.event"` no longer narrows.
function act(action: EventAction): void {
  const event = store.event;
  if (event) void actionDialogs.value?.[action](event);
}

function onChanged(event: AdminEventDetail): void {
  store.applyEvent(event);
  void store.loadAudit();
}

function onPeopleChanged(): void {
  void store.loadAudit();
}

async function refresh(): Promise<void> {
  await Promise.all([store.loadEvent(), store.loadGames(true), store.loadAudit()]);
}

async function init(): Promise<void> {
  if (!hasPermission.value) {
    store.clear();
    return;
  }
  await store.open(props.eventId);
}

watch(hasPermission, init);
watch(() => props.eventId, init);
onMounted(init);
</script>
