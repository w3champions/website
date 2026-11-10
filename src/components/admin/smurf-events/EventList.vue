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
        <v-col cols="12" sm="auto" class="d-flex ga-2 justify-end">
          <v-btn variant="text" :prepend-icon="mdiRefresh" :disabled="store.listLoading" @click="store.loadList()">
            {{ t(key("refresh")) }}
          </v-btn>
          <v-btn v-if="canAdminister" color="primary" variant="flat" :prepend-icon="mdiPlus" @click="emit('create')">
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
      :headers="headers"
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
      <template v-slot:[`item.origin`]="{ item }">
        <v-chip size="small" variant="outlined">{{ originLabel(item.origin, tr) }}</v-chip>
      </template>
      <template v-slot:[`item.review`]="{ item }">
        <v-chip size="small" variant="tonal" :color="reviewColor(item.review)">{{ reviewLabel(item.review, tr) }}</v-chip>
      </template>
      <template v-slot:[`item.span`]="{ item }">
        <span class="text-no-wrap">{{ formatUtc(item.from) }}</span><br /><span class="text-no-wrap text-medium-emphasis">{{ formatUtc(item.to) }}</span>
      </template>
    </v-data-table>

    <div v-if="store.next !== null" class="d-flex justify-center pa-3">
      <v-btn variant="tonal" :loading="store.listLoading" @click="store.loadMore()">{{ t(key("load_more")) }}</v-btn>
    </div>
  </v-card>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { mdiPlus, mdiRefresh } from "@mdi/js";
import type { DataTableHeader } from "vuetify";
import { formatUtc } from "@/helpers/utc-dates";
import type { SmurfEventOrigin, SmurfEventReview, SmurfEventSummary } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { errorText, originLabel, reviewColor, reviewLabel } from "@/store/admin/smurfEvents/labels";
import { type SmurfEventFilters, useSmurfEventsStore } from "@/store/admin/smurfEvents/store";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";

defineProps<{
  canAdminister: boolean;
  filters: SmurfEventFilters;
}>();

const emit = defineEmits<{
  (e: "update:filters", filters: SmurfEventFilters): void;
  (e: "create"): void;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});
const route = useRoute();
const store = useSmurfEventsStore();

const ORIGINS: SmurfEventOrigin[] = ["detected", "historical", "manual", "carried-over"];
const REVIEWS: SmurfEventReview[] = ["unreviewed", "confirmed", "denied"];

const originItems = computed(() => [{ title: t(key("filter_any")), value: null }, ...ORIGINS.map((o) => ({ title: originLabel(o, tr), value: o }))]);
const reviewItems = computed(() => [{ title: t(key("filter_any")), value: null }, ...REVIEWS.map((r) => ({ title: reviewLabel(r, tr), value: r }))]);

function detailLink(id: string) {
  return { query: { ...route.query, event: id } };
}

// Unreviewed events wait for a moderator: their rows carry an accent.
function rowProps({ item }: { item: SmurfEventSummary }) {
  return { class: item.review === "unreviewed" ? "row-unreviewed" : "" };
}

const headers = computed<DataTableHeader[]>(() => [
  { title: t(key("col_name")), key: "name", sortable: false },
  { title: t(key("col_origin")), key: "origin", sortable: false },
  { title: t(key("col_review")), key: "review", sortable: false },
  { title: t(key("col_span")), key: "span", sortable: false },
  { title: t(key("col_networks")), key: "counts.networks", sortable: false, align: "end" },
  { title: t(key("col_machines")), key: "counts.machines", sortable: false, align: "end" },
  { title: t(key("col_attendees")), key: "counts.attendees", sortable: false, align: "end" },
  { title: t(key("col_ended_links")), key: "endedLinks", sortable: false, align: "end" },
]);

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
