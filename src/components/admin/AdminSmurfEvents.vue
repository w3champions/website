<template>
  <div>
    <v-card-title class="pt-3">
      {{ t(key("title")) }}
    </v-card-title>
    <v-container v-if="permissionsKnown && !canAdminister" class="w3-container-width">
      <v-alert type="warning" variant="tonal">{{ t(key("no_permission")) }}</v-alert>
    </v-container>
    <v-container v-else-if="canAdminister" class="w3-container-width">
      <v-alert
        v-if="notice"
        :type="noticeType"
        variant="tonal"
        class="mb-4"
        closable
        role="status"
        @click:close="notice = null"
      >
        {{ t(key(notice.kind)) }}
        <div v-if="notice.needsReview">{{ t(key("needs_review_again")) }}</div>
        <div v-if="notice.notApplying">{{ t(key("not_applying_write")) }}</div>
      </v-alert>

      <event-detail
        v-if="eventId"
        :event-id="eventId"
        @back="showList"
        @open-event="openEvent"
        @retry-history="store.loadHistory(eventId)"
        @retry-identifiers="store.loadIdentifiers(eventId)"
        @review="openReview"
        @rename="openRename"
        @edit="openManual(store.detail)"
        @delete="openDelete"
      />
      <event-list
        v-else
        :filters="store.filters"
        @update:filters="applyFilters"
        @create="openManual(null)"
      />

      <manual-event-dialog v-model="manualOpen" :event="editing" @saved="onSaved" />
      <review-dialog v-model="reviewOpen" :event="store.detail" @reviewed="onReviewed" />
      <rename-dialog v-model="renameOpen" :event="store.detail" @renamed="onRenamed" />
      <delete-event-dialog v-model="deleteOpen" :event="store.detail" @deleted="onDeleted" />
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { type LocationQuery, useRoute, useRouter } from "vue-router";
import type { SmurfEventDetail } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { isOrigin, isReview } from "@/store/admin/smurfEvents/labels";
import { EPermission } from "@/store/admin/permission/types";
import { type SmurfEventFilters, useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { key } from "@/store/admin/smurfEvents/translate";
import { useOauthStore } from "@/store/oauth/store";
import DeleteEventDialog from "./smurf-events/DeleteEventDialog.vue";
import EventDetail from "./smurf-events/EventDetail.vue";
import EventList from "./smurf-events/EventList.vue";
import ManualEventDialog from "./smurf-events/ManualEventDialog.vue";
import RenameDialog from "./smurf-events/RenameDialog.vue";
import ReviewDialog from "./smurf-events/ReviewDialog.vue";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const oauthStore = useOauthStore();
const store = useSmurfEventsStore();

const permissions = computed<string[]>(() => oauthStore.permissions);
const permissionsKnown = computed(() => permissions.value.length > 0);
const canAdminister = computed(() => permissions.value.includes(EPermission[EPermission.SmurfCheckerAdministration]));

/** A write's success notice, shown while the view it belongs to (`view`: an event id, "" for the list) is shown. */
type NoticeKind = "saved" | "saved_pending" | "existing" | "reviewed" | "reviewed_pending" | "renamed" | "deleted";
interface Notice {
  kind: NoticeKind;
  view: string;
  /** An edit took a confirmed event back to unreviewed. */
  needsReview?: true;
  /** Smurf events do not change links at the moment: the write changed none. */
  notApplying?: true;
}
const notice = ref<Notice | null>(null);
// A change stored but not yet applied to the links is news, not plain success.
const noticeType = computed(() => (notice.value?.kind.endsWith("_pending") || notice.value?.kind === "existing" ? "info" : "success"));
const manualOpen = ref(false);
const reviewOpen = ref(false);
const renameOpen = ref(false);
const deleteOpen = ref(false);
const editing = ref<SmurfEventDetail | null>(null);
// The view the manual dialog was opened from (an event id, "" for the list).
let manualOpenedFrom = "";
let reviewOpenedFrom = "";
let renameOpenedFrom = "";
let deleteOpenedFrom = "";

function queryText(value: LocationQuery[string]): string {
  return typeof value === "string" ? value : "";
}

const eventId = computed(() => queryText(route.query.event));

/** The filters in the URL; a value the page does not know counts as no filter. */
function filtersFromQuery(query: LocationQuery): SmurfEventFilters {
  const origin = queryText(query.origin);
  const review = queryText(query.review);
  return {
    origin: isOrigin(origin) ? origin : null,
    review: isReview(review) ? review : null,
  };
}

/** Filters live in the URL (one history entry per change); the query watcher loads the list. */
function applyFilters(filters: SmurfEventFilters): void {
  router.push({ query: { ...route.query, origin: filters.origin ?? undefined, review: filters.review ?? undefined } }).catch(() => null);
}

function showList(): void {
  router.push({ query: { ...route.query, event: undefined } }).catch(() => null);
}

function openManual(event: SmurfEventDetail | null): void {
  editing.value = event;
  manualOpenedFrom = eventId.value;
  manualOpen.value = true;
}

function onSaved(saved: SmurfEventDetail, flags: { applied: boolean; applies?: boolean; existing: boolean; needsReview: boolean }): void {
  // A save that finishes after the moderator went to another view neither navigates nor claims that view.
  if (eventId.value !== manualOpenedFrom) return;
  const notApplying = flags.applies === false;
  // Without links changing, "the effect follows shortly" would mislead: the not-applying notice wins over the not-applied one.
  const kind: NoticeKind = !flags.applied && !notApplying ? "saved_pending" : flags.existing ? "existing" : "saved";
  notice.value = { kind, view: saved.id, ...(flags.needsReview ? { needsReview: true as const } : {}), ...(notApplying ? { notApplying: true as const } : {}) };
  // An edit in place changes the record and the identifiers; a create loads them when the new event's view opens.
  if (saved.id === eventId.value) loadEventTables(saved.id);
  if (saved.id !== eventId.value) router.push({ query: { ...route.query, event: saved.id } }).catch(() => null);
}

function openReview(): void {
  reviewOpenedFrom = eventId.value;
  reviewOpen.value = true;
}

function openRename(): void {
  renameOpenedFrom = eventId.value;
  renameOpen.value = true;
}

function openDelete(): void {
  deleteOpenedFrom = eventId.value;
  deleteOpen.value = true;
}

function onReviewed(applied: boolean, applies?: boolean): void {
  // A review that finishes after the moderator went to another view says nothing there and moves nothing.
  if (eventId.value !== reviewOpenedFrom) return;
  void store.loadHistory(eventId.value);
  const notApplying = applies === false;
  notice.value = { kind: applied || notApplying ? "reviewed" : "reviewed_pending", view: eventId.value, ...(notApplying ? { notApplying: true as const } : {}) };
}

function onRenamed(): void {
  if (eventId.value !== renameOpenedFrom) return;
  void store.loadHistory(eventId.value);
  notice.value = { kind: "renamed", view: eventId.value };
}

function onDeleted(): void {
  if (eventId.value !== deleteOpenedFrom) return;
  notice.value = { kind: "deleted", view: "" };
  showList();
}

/** The tables of the event page: its decision record and its identifiers. */
function loadEventTables(id: string): void {
  void store.loadHistory(id);
  void store.loadIdentifiers(id);
}

/**
 * The one place an event is fetched: openDetail drops the history and the identifiers of the event
 * before it, so what belongs to the event page is asked for here, after every openDetail.
 */
function loadEvent(id: string): void {
  void store.openDetail(id);
  loadEventTables(id);
}

/** Shows another event; the same one is loaded again (a retry). */
function openEvent(id: string): void {
  if (id === eventId.value) loadEvent(id);
  else router.push({ query: { ...route.query, event: id } }).catch(() => null);
}

watch(eventId, (id, previous) => {
  if (id === previous) return;
  if (notice.value !== null && notice.value.view !== id) notice.value = null;
  // Without the permission nothing is requested, not even on back and forward between event URLs.
  if (!canAdminister.value) return;
  if (!id) store.closeDetail();
  // A create already put the saved event in the store: no second load of it, but its tables are still to be read.
  else if (store.detail?.id !== id) loadEvent(id);
  else loadEventTables(id);
});

const filterKey = computed(() => JSON.stringify(filtersFromQuery(route.query)));

// Filter changes, browser back and forward included, load the list for the filters in the URL.
watch(filterKey, () => {
  if (canAdminister.value) void store.setFilters(filtersFromQuery(route.query));
});

function loadPage(): void {
  void store.setFilters(filtersFromQuery(route.query));
  if (eventId.value) loadEvent(eventId.value);
}

onMounted(() => {
  if (canAdminister.value) loadPage();
});

// Permissions can arrive after the page mounted (a direct load): load once they do.
watch(canAdminister, (can, could) => {
  if (can && !could) loadPage();
});

onBeforeUnmount(() => store.clear());
</script>
