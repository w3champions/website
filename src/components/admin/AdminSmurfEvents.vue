<template>
  <div>
    <v-card-title class="pt-3">
      {{ t(key("title")) }}
    </v-card-title>
    <v-container v-if="permissionsKnown && !canQuery" class="w3-container-width">
      <v-alert type="warning" variant="tonal">{{ t(key("no_permission")) }}</v-alert>
    </v-container>
    <v-container v-else-if="canQuery" class="w3-container-width">
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
      </v-alert>

      <event-detail
        v-if="eventId"
        :event-id="eventId"
        :can-administer="canAdminister"
        @back="showList"
        @review="reviewOpen = true"
        @edit="openManual(store.detail)"
        @delete="deleteOpen = true"
      />
      <event-list
        v-else
        :can-administer="canAdminister"
        :filters="store.filters"
        @update:filters="applyFilters"
        @create="openManual(null)"
      />

      <template v-if="canAdminister">
        <manual-event-dialog v-model="manualOpen" :event="editing" @saved="onSaved" />
        <review-dialog v-model="reviewOpen" :event="store.detail" @reviewed="onReviewed" />
        <delete-event-dialog v-model="deleteOpen" :event="store.detail" @deleted="onDeleted" />
      </template>
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { type LocationQuery, useRoute, useRouter } from "vue-router";
import type { SmurfEventDetail, SmurfEventOrigin, SmurfEventReview } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { EPermission } from "@/store/admin/permission/types";
import { type SmurfEventFilters, useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { key } from "@/store/admin/smurfEvents/translate";
import { useOauthStore } from "@/store/oauth/store";
import DeleteEventDialog from "./smurf-events/DeleteEventDialog.vue";
import EventDetail from "./smurf-events/EventDetail.vue";
import EventList from "./smurf-events/EventList.vue";
import ManualEventDialog from "./smurf-events/ManualEventDialog.vue";
import ReviewDialog from "./smurf-events/ReviewDialog.vue";

const ORIGINS: readonly string[] = ["detected", "historical", "manual", "carried-over"];
const REVIEWS: readonly string[] = ["unreviewed", "confirmed", "denied"];

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const oauthStore = useOauthStore();
const store = useSmurfEventsStore();

const permissions = computed<string[]>(() => oauthStore.permissions);
const permissionsKnown = computed(() => permissions.value.length > 0);
const canQuery = computed(() => permissions.value.includes(EPermission[EPermission.SmurfCheckerQuery]));
const canAdminister = computed(() => permissions.value.includes(EPermission[EPermission.SmurfCheckerAdministration]));

/** A write's success notice, shown while the view it belongs to (`view`: an event id, "" for the list) is shown. */
type NoticeKind = "saved" | "saved_pending" | "existing" | "reviewed" | "reviewed_pending" | "deleted";
interface Notice {
  kind: NoticeKind;
  view: string;
}
const notice = ref<Notice | null>(null);
// A change stored but not yet applied to the links is news, not plain success.
const noticeType = computed(() => (notice.value?.kind.endsWith("_pending") || notice.value?.kind === "existing" ? "info" : "success"));
const manualOpen = ref(false);
const reviewOpen = ref(false);
const deleteOpen = ref(false);
const editing = ref<SmurfEventDetail | null>(null);
// The view the manual dialog was opened from (an event id, "" for the list).
let manualOpenedFrom = "";

function queryText(value: LocationQuery[string]): string {
  return typeof value === "string" ? value : "";
}

const eventId = computed(() => queryText(route.query.event));

/** The filters in the URL; a value the page does not know counts as no filter. */
function filtersFromQuery(query: LocationQuery): SmurfEventFilters {
  const origin = queryText(query.origin);
  const review = queryText(query.review);
  return {
    origin: ORIGINS.includes(origin) ? (origin as SmurfEventOrigin) : null,
    review: REVIEWS.includes(review) ? (review as SmurfEventReview) : null,
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

function onSaved(saved: SmurfEventDetail, flags: { applied: boolean; existing: boolean }): void {
  // A save that finishes after the moderator went to another view neither navigates nor claims that view.
  if (eventId.value !== manualOpenedFrom) return;
  const kind: NoticeKind = !flags.applied ? "saved_pending" : flags.existing ? "existing" : "saved";
  notice.value = { kind, view: saved.id };
  if (saved.id !== eventId.value) router.push({ query: { ...route.query, event: saved.id } }).catch(() => null);
}

function onReviewed(applied: boolean): void {
  notice.value = { kind: applied ? "reviewed" : "reviewed_pending", view: eventId.value };
}

function onDeleted(): void {
  notice.value = { kind: "deleted", view: "" };
  showList();
}

watch(eventId, (id, previous) => {
  if (id === previous) return;
  if (notice.value !== null && notice.value.view !== id) notice.value = null;
  // A create already put the saved event in the store: no second load.
  if (id && store.detail?.id !== id) void store.openDetail(id);
  else if (!id) store.closeDetail();
});

const filterKey = computed(() => JSON.stringify(filtersFromQuery(route.query)));

// Filter changes, browser back and forward included, load the list for the filters in the URL.
watch(filterKey, () => {
  if (canQuery.value) void store.setFilters(filtersFromQuery(route.query));
});

function loadPage(): void {
  void store.setFilters(filtersFromQuery(route.query));
  if (eventId.value) void store.openDetail(eventId.value);
}

onMounted(() => {
  if (canQuery.value) loadPage();
});

// Permissions can arrive after the page mounted (a direct load): load once they do.
watch(canQuery, (can, could) => {
  if (can && !could) loadPage();
});

onBeforeUnmount(() => store.clear());
</script>
