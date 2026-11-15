<template>
  <div>
    <v-btn variant="text" class="mb-2 px-1" :prepend-icon="mdiArrowLeft" @click="emit('back')">{{ t(key("back")) }}</v-btn>

    <v-card v-if="store.detailLoading && !event" class="mb-4">
      <v-progress-linear indeterminate color="primary" />
      <v-card-text class="text-medium-emphasis" role="status">{{ t(key("loading_event")) }}</v-card-text>
    </v-card>

    <v-alert v-else-if="store.detailError" type="error" variant="tonal" class="mb-4">
      {{ errorText(store.detailError, tr) }}
      <template v-slot:append>
        <v-btn variant="text" size="small" @click="emit('open-event', eventId)">{{ t(key("retry")) }}</v-btn>
      </template>
    </v-alert>

    <template v-else-if="event">
      <v-card class="mb-4">
        <v-card-text>
          <div class="d-flex flex-wrap align-center ga-2 mb-2">
            <v-btn size="small" variant="text" :disabled="neighbours.previous === null" @click="openNeighbour(neighbours.previous)">{{ t(key("nav_previous")) }}</v-btn>
            <v-btn size="small" variant="text" :disabled="neighbours.next === null" @click="openNeighbour(neighbours.next)">{{ t(key("nav_next")) }}</v-btn>
          </div>
          <div class="d-flex flex-wrap align-center ga-2 event-header">
            <h2 class="text-h5">{{ event.name }}</h2>
            <v-btn
              icon
              size="small"
              variant="text"
              :aria-label="t(key('rename_action'))"
              :title="t(key('rename_action'))"
              @click="emit('rename')"
            >
              <v-icon :icon="mdiRenameBox" />
            </v-btn>
            <event-badge kind="origin" :value="event.origin" />
            <event-badge kind="review" :value="event.review" />
            <v-spacer />
            <div class="d-flex flex-wrap ga-2">
              <v-btn v-if="actions.review" color="primary" variant="flat" :prepend-icon="mdiGavel" @click="emit('review')">{{ t(key("action_review")) }}</v-btn>
              <v-btn v-if="actions.edit" variant="tonal" :prepend-icon="mdiPencil" @click="emit('edit')">{{ t(key("action_edit")) }}</v-btn>
              <v-btn v-if="actions.delete" variant="text" :prepend-icon="mdiDelete" @click="emit('delete')">{{ t(key("action_delete")) }}</v-btn>
            </div>
          </div>
          <div class="text-body-1 mt-2">{{ spanText(event.from, event.to) }}</div>
          <div class="text-body-2 text-medium-emphasis">
            <span v-if="event.requested">{{ t(key("requested_span"), { span: spanText(event.requested.from, event.requested.to) }) }} · </span>
            {{ t(key("created_at"), { at: formatUtc(event.createdAt) }) }}
            <span v-if="event.reviewedBy && event.reviewedAt"> · {{ t(key("reviewed_by"), { author: event.reviewedBy, at: formatUtc(event.reviewedAt) }) }}</span>
          </div>
          <div v-if="consequence" class="consequence text-body-2 mt-3">{{ consequence }}</div>
        </v-card-text>
      </v-card>

      <v-row>
        <v-col cols="12" md="5">
          <event-facts :event="event" />
        </v-col>
        <v-col cols="12" md="7">
          <v-card class="mb-4 h-100">
            <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center">
              {{ t(key("attendees")) }}
              <v-chip size="small" class="ml-2" variant="tonal">{{ event.attendees.length }}</v-chip>
            </v-card-title>
            <v-card-text>
              <attendee-presence-table v-if="store.presence" :presence="store.presence" :anchors="anchors" />
              <template v-else>
                <v-chip
                  v-for="tag in event.attendees"
                  :key="tag"
                  size="small"
                  class="mr-1 my-1"
                  :variant="anchors.has(tag) ? 'flat' : 'tonal'"
                  :color="anchors.has(tag) ? 'primary' : undefined"
                  :to="hardwareLink(tag)"
                  :prepend-icon="anchors.has(tag) ? mdiAnchor : undefined"
                  :title="anchors.has(tag) ? t(key('anchor')) : undefined"
                >
                  <span v-if="anchors.has(tag)" class="d-sr-only">{{ t(key("anchor")) }}: </span>{{ tag }}
                </v-chip>
              </template>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <event-history
        :history="store.history"
        :loading="store.historyLoading"
        :error="store.historyError ? errorText(store.historyError, tr) : null"
        @retry="emit('retry-history')"
      />

      <venue-networks-card
        v-if="event.networks.length > 0"
        :presence="store.presence"
        :identifiers="store.identifiers"
        :network-count="event.networks.length"
        :loading="store.presenceLoading"
        :error="presenceError"
        @retry="emit('retry-presence')"
      />
      <attendee-spread
        v-else-if="store.presence?.spread || store.presenceLoading || store.presenceError"
        :spread="store.presence?.spread ?? null"
        :loading="store.presenceLoading"
        :error="presenceError"
        @retry="emit('retry-presence')"
      />

      <identifier-table
        :identifiers="store.identifiers"
        :loading="store.identifiersLoading"
        :error="store.identifiersError ? errorText(store.identifiersError, tr) : null"
        @retry="emit('retry-identifiers')"
      />

      <v-card class="mb-4">
        <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center">
          {{ t(key("ended_links")) }}
          <v-chip size="small" class="ml-2" variant="tonal">{{ event.endedLinks }}</v-chip>
        </v-card-title>
        <v-card-text v-if="event.endedLinksListTruncated" class="pt-0 pb-2 text-body-2 text-medium-emphasis" role="status">{{ t(key("ended_links_truncated")) }}</v-card-text>
        <v-data-table
          :headers="linkHeaders"
          :items="event.endedLinksList"
          :item-value="(l: SmurfEventLinkRef) => `${l.a}|${l.b}`"
          density="compact"
          :items-per-page="LINKS_PAGE"
          :hide-default-footer="event.endedLinksList.length <= LINKS_PAGE"
          :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
          :no-data-text="t(key('no_ended_links'))"
        >
          <template v-slot:[`item.link`]="{ item }">
            <account-link :battle-tag="item.a" />
            <span class="text-medium-emphasis mx-2">–</span>
            <account-link :battle-tag="item.b" />
          </template>
          <template v-slot:[`item.source`]="{ item }">
            <v-chip size="small" variant="outlined">{{ sourceLabel(item.source, tr) }}</v-chip>
          </template>
        </v-data-table>
      </v-card>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { mdiAnchor, mdiArrowLeft, mdiDelete, mdiGavel, mdiPencil, mdiRenameBox } from "@mdi/js";
import type { DataTableHeader } from "vuetify";
import { formatUtc } from "@/helpers/utc-dates";
import type { SmurfEventLinkRef } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { sourceLabel } from "@/store/admin/hardwareSmurfs/labels";
import { factText } from "@/store/admin/smurfEvents/facts";
import { smurfEventActions } from "@/store/admin/smurfEvents/actions";
import { errorText, presenceErrorText } from "@/store/admin/smurfEvents/labels";
import { unreviewedNeighbours } from "@/store/admin/smurfEvents/neighbours";
import { useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { hardwareLink } from "@/store/admin/smurfEvents/presence";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";
import AccountLink from "./AccountLink.vue";
import AttendeePresenceTable from "./AttendeePresenceTable.vue";
import AttendeeSpread from "./AttendeeSpread.vue";
import EventBadge from "./EventBadge.vue";
import EventFacts from "./EventFacts.vue";
import EventHistory from "./EventHistory.vue";
import IdentifierTable from "./IdentifierTable.vue";
import VenueNetworksCard from "./VenueNetworksCard.vue";

const LINKS_PAGE = 25;

const props = defineProps<{
  eventId: string;
}>();

const emit = defineEmits<{
  (e: "back"): void;
  (e: "review"): void;
  (e: "edit"): void;
  (e: "delete"): void;
  (e: "rename"): void;
  (e: "open-event", id: string): void;
  (e: "retry-history"): void;
  (e: "retry-identifiers"): void;
  (e: "retry-presence"): void;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});
const store = useSmurfEventsStore();

const event = computed(() => (store.detail?.id === props.eventId ? store.detail : null));
const actions = computed(() => smurfEventActions(event.value ?? { origin: "detected" }));
const presenceError = computed(() => (store.presenceError ? presenceErrorText(store.presenceError, tr) : null));
const anchors = computed(() => new Set(event.value?.anchors ?? []));

function spanText(from: string, to: string): string {
  return t(key("span"), { from: formatUtc(from), to: formatUtc(to) });
}

/** The unreviewed events before and after this one in the server's queue order, placed by this event's own date and id. */
const neighbours = computed(() => (event.value ? unreviewedNeighbours(store.events, event.value) : { previous: null, next: null }));

function openNeighbour(id: string | null): void {
  if (id !== null) emit("open-event", id);
}

/**
 * The live links among the attendees, from the live list: all of them when the list is complete, "at least"
 * the links shown when it is cut (the stored count may be stale, so it is not mixed in). The stored count (as of
 * its own time) alone only when the list is absent; nothing when the event is too large to count.
 */
const consequence = computed(() => {
  const e = event.value;
  const live = e?.liveLinks;
  const stored = e?.facts?.liveLinks;
  if (!live) {
    // The read ran out of time: nothing is known this time, whatever the stored facts counted earlier.
    if (e?.liveLinksTimedOut === true) return t(key("consequence_timed_out"));
    if (stored === undefined) return null;
    return t(key("consequence_live_count"), { count: factText(stored, e?.facts?.liveLinksCapped, tr), at: formatUtc(e?.facts?.at) });
  }
  if (live.links.length === 0 && live.truncated !== true) return t(key("consequence_none"));
  const links = linkNames(live.links);
  if (live.truncated) return t(key("consequence_live_at_least"), { count: live.links.length, links });
  return t(key(`consequence_live_${live.links.length === 1 ? "one" : "other"}`), { count: live.links.length, links });
});

function linkNames(links: SmurfEventLinkRef[]): string {
  return links.map((l) => `${l.a} \u2013 ${l.b}`).join(", ");
}

const linkHeaders = computed<DataTableHeader[]>(() => [
  { title: t(key("col_link")), key: "link", sortable: false },
  { title: t(key("col_source")), key: "source", sortable: false },
]);
</script>
