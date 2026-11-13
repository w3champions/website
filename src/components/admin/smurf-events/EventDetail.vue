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
              <v-icon :icon="mdiPencil" />
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

      <identifier-table
        :identifiers="store.identifiers"
        :loading="store.identifiersLoading"
        :error="store.identifiersError ? errorText(store.identifiersError, tr) : null"
        @retry="emit('retry-identifiers')"
        @open-event="(id) => emit('open-event', id)"
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
            <router-link :to="hardwareLink(item.a)" class="account-link">{{ item.a }}</router-link>
            <span class="text-medium-emphasis mx-2">–</span>
            <router-link :to="hardwareLink(item.b)" class="account-link">{{ item.b }}</router-link>
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
import { mdiAnchor, mdiArrowLeft, mdiDelete, mdiGavel, mdiPencil } from "@mdi/js";
import type { DataTableHeader } from "vuetify";
import { formatUtc } from "@/helpers/utc-dates";
import { EAdminRouteName } from "@/router/types";
import type { SmurfEventLinkRef, SmurfEventSummary } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { sourceLabel } from "@/store/admin/hardwareSmurfs/labels";
import { smurfEventActions } from "@/store/admin/smurfEvents/actions";
import { errorText } from "@/store/admin/smurfEvents/labels";
import { useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";
import EventBadge from "./EventBadge.vue";
import EventFacts from "./EventFacts.vue";
import EventHistory from "./EventHistory.vue";
import IdentifierTable from "./IdentifierTable.vue";

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
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});
const store = useSmurfEventsStore();

const event = computed(() => (store.detail?.id === props.eventId ? store.detail : null));
const actions = computed(() => smurfEventActions(event.value ?? { origin: "detected" }));
const anchors = computed(() => new Set(event.value?.anchors ?? []));

function spanText(from: string, to: string): string {
  return t(key("span"), { from: formatUtc(from), to: formatUtc(to) });
}

function hardwareLink(battleTag: string) {
  return { name: EAdminRouteName.SMURF_CHECKER_HARDWARE_LINKS, query: { player: battleTag } };
}

/** The unreviewed events before and after this one in the list as loaded; none when the event is not in it. */
const neighbours = computed<{ previous: string | null; next: string | null }>(() => {
  const events: SmurfEventSummary[] = store.events;
  const at = events.findIndex((e) => e.id === props.eventId);
  if (at < 0) return { previous: null, next: null };
  const unreviewed = (e: SmurfEventSummary) => e.review === "unreviewed";
  return {
    previous: events.slice(0, at).reverse().find(unreviewed)?.id ?? null,
    next: events.slice(at + 1).find(unreviewed)?.id ?? null,
  };
});

function openNeighbour(id: string | null): void {
  if (id !== null) emit("open-event", id);
}

/** The live links among the attendees: what the event's effect on links comes down to; absent when the server did not count them. */
const consequence = computed(() => {
  const live = event.value?.liveLinks;
  if (!live) return null;
  if (live.links.length === 0) return t(key("consequence_none"));
  const links = live.links.map((l) => `${l.a} – ${l.b}`).join(", ");
  if (live.truncated) return t(key("consequence_live_at_least"), { count: live.links.length, links });
  return t(key(`consequence_live_${live.links.length === 1 ? "one" : "other"}`), { count: live.links.length, links });
});

const linkHeaders = computed<DataTableHeader[]>(() => [
  { title: t(key("col_link")), key: "link", sortable: false },
  { title: t(key("col_source")), key: "source", sortable: false },
]);
</script>

<style scoped>
.account-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.account-link:hover {
  text-decoration: underline;
}

.account-link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>
