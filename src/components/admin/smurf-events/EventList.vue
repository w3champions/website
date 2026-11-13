<template>
  <v-card class="mb-4">
    <v-card-text>
      <div class="text-body-2 text-medium-emphasis mb-4">{{ t(key("list_hint")) }}</div>
      <v-row class="align-center" dense>
        <v-col cols="12" sm="4" md="3">
          <v-select
            :model-value="filters.origin"
            :label="t(key('filter_origin'))"
            :items="originItems"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="(origin: SmurfEventOrigin | null) => emit('update:filters', { ...filters, origin })"
          />
        </v-col>
        <v-col cols="12" sm="4" md="3">
          <v-select
            :model-value="filters.review"
            :label="t(key('filter_review'))"
            :items="reviewItems"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="compact"
            hide-details
            @update:model-value="(review: SmurfEventReview | null) => emit('update:filters', { ...filters, review })"
          />
        </v-col>
        <v-spacer />
        <v-col cols="12" sm="auto" class="d-flex flex-wrap ga-2 justify-end">
          <v-btn variant="text" :prepend-icon="mdiRefresh" :disabled="store.listLoading" @click="store.loadList()">
            {{ t(key("refresh")) }}
          </v-btn>
          <v-btn color="primary" variant="flat" :prepend-icon="mdiPlus" @click="emit('create')">
            {{ t(key("new_manual")) }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>

    <v-alert v-if="store.listError" type="error" variant="tonal" density="compact" class="mx-4 mb-2">
      {{ errorText(store.listError, tr) }}
      <template v-slot:append>
        <v-btn variant="text" size="small" @click="store.loadList()">{{ t(key("retry")) }}</v-btn>
      </template>
    </v-alert>

    <v-data-table
      v-model:sort-by="sortBy"
      :headers="headers"
      initial-sort-order="desc"
      :items="store.events"
      :loading="store.listLoading"
      :items-per-page="-1"
      :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
      :row-props="rowProps"
      item-value="id"
      density="compact"
      hide-default-footer
      hover
      :no-data-text="store.listError ? '' : t(key('no_events'))"
    >
      <template v-slot:[`item.name`]="{ item }">
        <router-link :to="detailLink(item.id)" class="event-link font-weight-medium">{{ item.name }}</router-link>
      </template>
      <template v-slot:[`item.review`]="{ item }">
        <event-badge kind="review" :value="item.review" />
      </template>
      <template v-slot:[`item.span`]="{ item }">
        <span class="text-no-wrap">{{ formatUtc(item.from) }}</span><br /><span class="text-no-wrap text-medium-emphasis">{{ formatUtc(item.to) }}</span>
      </template>
      <template v-slot:[`item.facts.networks`]="{ item }">{{ factText(item.facts?.networks, undefined, tr) }}</template>
      <template v-slot:[`item.facts.identifiers`]="{ item }">{{ identifiersText(item.facts, tr) }}</template>
      <template v-slot:[`item.facts.maxAccountsEver`]="{ item }">{{ factText(item.facts?.maxAccountsEver, maxAccountsCapped(item.facts), tr) }}</template>
      <template v-slot:[`item.facts.attendees`]="{ item }">{{ factText(item.facts?.attendees, undefined, tr) }}</template>
      <template v-slot:[`item.facts.endedLinks`]="{ item }">{{ factText(item.facts?.endedLinks, undefined, tr) }}</template>
      <template v-slot:[`item.facts.liveLinks`]="{ item }">
        <v-tooltip v-if="item.facts?.liveLinks === undefined && item.facts?.liveLinksTimedOut === true" :text="t(key('fact_live_timed_out_hint'))" location="bottom">
          <template v-slot:activator="{ props: activator }">
            <span v-bind="activator" tabindex="0" class="text-medium-emphasis">{{ t(key("fact_live_timed_out")) }}</span>
          </template>
        </v-tooltip>
        <template v-else>{{ factText(item.facts?.liveLinks, item.facts?.liveLinksCapped, tr) }}</template>
      </template>
      <!-- A header slot replaces the whole cell: the default title and sort icon are drawn again, and the tooltip hangs on the cell itself (already focusable), so there is one tab stop. -->
      <template v-for="column in factColumns" :key="column" v-slot:[`header.${column}`]="{ column: header, getSortIcon }">
        <div class="v-data-table-header__content">
          <span>{{ header.title }}</span>
          <v-icon class="v-data-table-header__sort-icon" :icon="getSortIcon(header)" />
        </div>
        <v-tooltip activator="parent" :text="t(key('facts_refreshed_hint'))" location="bottom" />
      </template>
    </v-data-table>

    <div v-if="store.next !== null" class="text-caption text-medium-emphasis px-4 pb-1">{{ t(key("sort_loaded_only")) }}</div>

    <div v-if="store.next !== null" class="d-flex justify-center pa-3">
      <v-btn variant="tonal" :loading="store.listLoading" @click="store.loadMore()">{{ t(key("load_more")) }}</v-btn>
    </div>
  </v-card>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { mdiPlus, mdiRefresh } from "@mdi/js";
import type { DataTableHeader } from "vuetify";
import { formatUtc } from "@/helpers/utc-dates";
import type { SmurfEventOrigin, SmurfEventReview, SmurfEventSummary } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { factSort, factSortSwapped, factText, identifiersText, maxAccountsCapped, type SortOrder, sortFromQuery, sortToQuery } from "@/store/admin/smurfEvents/facts";
import { errorText, ORIGINS, originLabel, REVIEWS, reviewLabel } from "@/store/admin/smurfEvents/labels";
import { type SmurfEventFilters, useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";
import EventBadge from "./EventBadge.vue";

defineProps<{
  filters: SmurfEventFilters;
}>();

const emit = defineEmits<{
  (e: "update:filters", filters: SmurfEventFilters): void;
  (e: "create"): void;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});
const route = useRoute();
const router = useRouter();
const store = useSmurfEventsStore();

const originItems = computed(() => [{ title: t(key("filter_any")), value: null }, ...ORIGINS.map((o) => ({ title: originLabel(o, tr), value: o }))]);
const reviewItems = computed(() => [{ title: t(key("filter_any")), value: null }, ...REVIEWS.map((r) => ({ title: reviewLabel(r, tr), value: r }))]);

function detailLink(id: string) {
  return { query: { ...route.query, event: id } };
}

// Unreviewed events wait for a moderator: their rows carry an accent.
function rowProps({ item }: { item: SmurfEventSummary }) {
  return { class: item.review === "unreviewed" ? "row-unreviewed" : "" };
}

const factColumns = ["facts.networks", "facts.identifiers", "facts.maxAccountsEver", "facts.attendees", "facts.endedLinks", "facts.liveLinks"];

// Vuetify swaps the two values before it calls a header's `sort` when the order is descending.
function sortFacts(a: number | undefined, b: number | undefined): number {
  return sortBy.value[0]?.order === "desc" ? factSortSwapped(a, b) : factSort(a, b);
}

const headers = computed<DataTableHeader[]>(() => [
  { title: t(key("col_name")), key: "name", sortable: false },
  { title: t(key("col_span")), key: "span", sortable: false },
  { title: t(key("col_review")), key: "review", sortable: false },
  { title: t(key("col_networks")), key: "facts.networks", sortable: true, sort: sortFacts, align: "end" },
  { title: t(key("col_identifiers")), key: "facts.identifiers", sortable: true, sort: sortFacts, align: "end" },
  { title: t(key("col_max_accounts_ever")), key: "facts.maxAccountsEver", sortable: true, sort: sortFacts, align: "end" },
  { title: t(key("col_attendees")), key: "facts.attendees", sortable: true, sort: sortFacts, align: "end" },
  { title: t(key("col_ended_links")), key: "facts.endedLinks", sortable: true, sort: sortFacts, align: "end" },
  { title: t(key("col_live_links")), key: "facts.liveLinks", sortable: true, sort: sortFacts, align: "end" },
]);

// Empty: the server's order; the first click on a header sorts descending.
// The sort lives in the URL next to the filters, so it is still there when an event is closed again.
const sortColumns = computed(() => headers.value.filter((h) => h.sortable).map((h) => h.key as string));
type SortItems = Array<{ key: string; order?: boolean | SortOrder }>;

function sortFromRoute(): SortItems {
  const sort = sortFromQuery(route.query.sort, sortColumns.value);
  return sort === null ? [] : [sort];
}

const sortBy = ref<SortItems>(sortFromRoute());

// The table's sort goes to the URL; an order Vuetify leaves out or sets to `false` is no sort.
watch(sortBy, (items) => {
  const first = items[0];
  const sort = first !== undefined && (first.order === "asc" || first.order === "desc") ? sortToQuery({ key: first.key, order: first.order }) : undefined;
  if (sort !== queryText(route.query.sort)) void router.replace({ query: { ...route.query, sort } }).catch(() => null);
});

// Browser back and forward bring another sort in the URL.
watch(() => route.query.sort, () => {
  const fromRoute = sortFromRoute();
  if (sortToText(fromRoute) !== sortToText(sortBy.value)) sortBy.value = fromRoute;
});

function sortToText(items: SortItems): string {
  const first = items[0];
  return first === undefined || (first.order !== "asc" && first.order !== "desc") ? "" : sortToQuery({ key: first.key, order: first.order });
}

function queryText(value: unknown): string {
  return typeof value === "string" ? value : "";
}
</script>

<style scoped>
.event-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  border-radius: 2px;
}

.event-link:hover {
  text-decoration: underline;
}

.event-link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

:deep(.row-unreviewed) td:first-child {
  box-shadow: inset 3px 0 0 rgb(var(--v-theme-warning));
}
</style>
