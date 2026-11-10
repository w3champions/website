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
        type="success"
        variant="tonal"
        class="mb-4"
        closable
        role="status"
        @click:close="notice = null"
      >
        {{ t(key(notice)) }}
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
        <review-dialog v-model="reviewOpen" :event="store.detail" @reviewed="notice = 'reviewed'" />
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

type Notice = "saved" | "reviewed" | "deleted";
const notice = ref<Notice | null>(null);
const manualOpen = ref(false);
const reviewOpen = ref(false);
const deleteOpen = ref(false);
const editing = ref<SmurfEventDetail | null>(null);

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

function applyFilters(filters: SmurfEventFilters): void {
  router.replace({ query: { ...route.query, origin: filters.origin ?? undefined, review: filters.review ?? undefined } }).catch(() => null);
  void store.setFilters(filters);
}

function showList(): void {
  router.push({ query: { ...route.query, event: undefined } }).catch(() => null);
}

function openManual(event: SmurfEventDetail | null): void {
  editing.value = event;
  manualOpen.value = true;
}

function onSaved(saved: SmurfEventDetail): void {
  notice.value = "saved";
  if (saved.id !== eventId.value) router.push({ query: { ...route.query, event: saved.id } }).catch(() => null);
}

function onDeleted(): void {
  notice.value = "deleted";
  showList();
}

watch(eventId, (id, previous) => {
  if (id === previous) return;
  notice.value = null;
  if (id) void store.openDetail(id);
  else store.closeDetail();
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
