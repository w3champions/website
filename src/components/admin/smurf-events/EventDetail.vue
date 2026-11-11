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
        <v-btn variant="text" size="small" @click="store.openDetail(eventId)">{{ t(key("retry")) }}</v-btn>
      </template>
    </v-alert>

    <template v-else-if="event">
      <v-card class="mb-4 event-header" :class="`event-header--${event.review}`">
        <v-card-text>
          <div class="d-flex flex-wrap align-center ga-2">
            <h2 class="text-h5 mr-2">{{ event.name }}</h2>
            <v-chip size="small" variant="outlined">{{ originLabel(event.origin, tr) }}</v-chip>
            <v-chip size="small" variant="tonal" :color="reviewColor(event.review)">{{ reviewLabel(event.review, tr) }}</v-chip>
            <v-spacer />
            <div class="d-flex flex-wrap ga-2">
              <v-btn v-if="actions.review" color="primary" variant="flat" :prepend-icon="mdiGavel" @click="emit('review')">{{ t(key("action_review")) }}</v-btn>
              <v-btn v-if="actions.edit" variant="tonal" :prepend-icon="mdiPencil" @click="emit('edit')">{{ t(key("action_edit")) }}</v-btn>
              <v-btn v-if="actions.delete" variant="text" color="error" :prepend-icon="mdiDelete" @click="emit('delete')">{{ t(key("action_delete")) }}</v-btn>
            </div>
          </div>
          <div class="text-body-1 mt-2">{{ spanText(event.from, event.to) }}</div>
          <div class="text-body-2 text-medium-emphasis">
            <span v-if="event.requested">{{ t(key("requested_span"), { span: spanText(event.requested.from, event.requested.to) }) }} · </span>
            {{ t(key("created_at"), { at: formatUtc(event.createdAt) }) }}
            <span v-if="event.reviewedBy && event.reviewedAt"> · {{ t(key("reviewed_by"), { author: event.reviewedBy, at: formatUtc(event.reviewedAt) }) }}</span>
          </div>

          <div class="stat-grid mt-4">
            <div v-for="stat in stats" :key="stat.label" class="stat-tile">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <v-row>
        <v-col cols="12" md="5">
          <v-card class="mb-4 h-100">
            <v-card-title class="text-subtitle-1 font-weight-bold">{{ t(key("evidence")) }}</v-card-title>
            <v-card-subtitle class="pb-2">{{ t(key("evidence_hint")) }}</v-card-subtitle>
            <v-table density="compact">
              <tbody>
                <tr v-for="row in evidenceRows" :key="row.label">
                  <td>{{ row.label }}</td>
                  <td class="text-right font-weight-bold">{{ row.value }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
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

      <v-row>
        <v-col cols="12" md="7">
          <v-card class="mb-4">
            <v-card-title class="text-subtitle-1 font-weight-bold">{{ t(key("networks")) }}</v-card-title>
            <v-data-table
              :headers="networkHeaders"
              :items="event.networks"
              item-value="hash8"
              density="compact"
              :items-per-page="TABLE_PAGE"
              :hide-default-footer="event.networks.length <= TABLE_PAGE"
              :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
              :no-data-text="t(key('no_networks'))"
            >
              <template v-slot:[`item.hash8`]="{ item }"><span class="font-monospace">{{ item.hash8 }}</span></template>
              <template v-slot:[`item.firstAt`]="{ item }"><span class="text-no-wrap">{{ formatUtc(item.firstAt) }}</span></template>
              <template v-slot:[`item.lastAt`]="{ item }"><span class="text-no-wrap">{{ formatUtc(item.lastAt) }}</span></template>
            </v-data-table>
          </v-card>
        </v-col>
        <v-col cols="12" md="5">
          <v-card class="mb-4">
            <v-card-title class="text-subtitle-1 font-weight-bold">{{ t(key("machines")) }}</v-card-title>
            <v-data-table
              :headers="machineHeaders"
              :items="event.machines"
              item-value="hash8"
              density="compact"
              :items-per-page="TABLE_PAGE"
              :hide-default-footer="event.machines.length <= TABLE_PAGE"
              :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
              :no-data-text="t(key('no_machines'))"
            >
              <template v-slot:[`item.hash8`]="{ item }"><span class="font-monospace">{{ item.hash8 }}</span></template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>

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
import type { SmurfEventLinkRef } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { sourceLabel } from "@/store/admin/hardwareSmurfs/labels";
import { smurfEventActions } from "@/store/admin/smurfEvents/actions";
import { errorText, homesText, originLabel, reviewColor, reviewLabel } from "@/store/admin/smurfEvents/labels";
import { useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";

const TABLE_PAGE = 10;
const LINKS_PAGE = 25;

const props = defineProps<{
  eventId: string;
  canAdminister: boolean;
}>();

const emit = defineEmits<{
  (e: "back"): void;
  (e: "review"): void;
  (e: "edit"): void;
  (e: "delete"): void;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});
const store = useSmurfEventsStore();

const event = computed(() => (store.detail?.id === props.eventId ? store.detail : null));
const actions = computed(() => smurfEventActions(event.value ?? { origin: "detected" }, props.canAdminister));
const anchors = computed(() => new Set(event.value?.anchors ?? []));

function spanText(from: string, to: string): string {
  return t(key("span"), { from: formatUtc(from), to: formatUtc(to) });
}

function hardwareLink(battleTag: string) {
  return { name: EAdminRouteName.SMURF_CHECKER_HARDWARE_LINKS, query: { player: battleTag } };
}

const stats = computed(() => {
  const e = event.value;
  if (!e) return [];
  return [
    { label: t(key("count_networks")), value: e.counts.networks },
    { label: t(key("count_machines")), value: e.counts.machines },
    { label: t(key("count_attendees")), value: e.counts.attendees },
    { label: t(key("count_homes")), value: homesText(e.counts, tr) },
    { label: t(key("count_ended_links")), value: e.endedLinks },
  ];
});

const evidenceRows = computed(() => {
  const evidence = event.value?.evidence;
  if (!evidence) return [];
  const rows = [
    { label: t(key("evidence_countries")), value: evidence.countries },
    { label: t(key("evidence_days_before")), value: evidence.networkDaysBefore },
    { label: t(key("evidence_days_after")), value: evidence.networkDaysAfter },
    { label: t(key("evidence_returning")), value: evidence.returningAttendees },
  ];
  return evidence.pingClusters === undefined ? rows : [...rows, { label: t(key("evidence_ping_clusters")), value: evidence.pingClusters }];
});

const networkHeaders = computed<DataTableHeader[]>(() => [
  { title: t(key("col_hash8")), key: "hash8", sortable: false },
  { title: t(key("col_first")), key: "firstAt", sortable: false },
  { title: t(key("col_last")), key: "lastAt", sortable: false },
  { title: t(key("col_accounts")), key: "accounts", sortable: false, align: "end" },
]);

const machineHeaders = computed<DataTableHeader[]>(() => [
  { title: t(key("col_hash8")), key: "hash8", sortable: false },
  { title: t(key("col_accounts")), key: "accounts", sortable: false, align: "end" },
]);

const linkHeaders = computed<DataTableHeader[]>(() => [
  { title: t(key("col_link")), key: "link", sortable: false },
  { title: t(key("col_source")), key: "source", sortable: false },
]);
</script>

<style scoped>
.event-header {
  border-left: 4px solid rgb(var(--v-theme-primary));
}

.event-header--unreviewed {
  border-left-color: rgb(var(--v-theme-warning));
}

.event-header--confirmed {
  border-left-color: rgb(var(--v-theme-success));
}

.event-header--denied {
  border-left-color: rgba(var(--v-theme-on-surface), 0.38);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 8px;
}

.stat-tile {
  padding: 10px 12px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

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
