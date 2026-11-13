<template>
  <v-card class="mb-4">
    <v-card-title class="text-subtitle-1 font-weight-bold">{{ t(key("identifiers_title")) }}</v-card-title>
    <v-card-text v-if="loading" class="text-medium-emphasis" role="status">{{ t(key("identifiers_loading")) }}</v-card-text>
    <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="mx-4 mb-4">
      {{ t(key("identifiers_failed")) }} {{ error }}
      <template v-slot:append>
        <v-btn class="retry" variant="text" size="small" @click="emit('retry')">{{ t(key("retry")) }}</v-btn>
      </template>
    </v-alert>
    <template v-else-if="identifiers !== null">
      <v-card-text v-if="identifiers.rows.length === 0" class="text-medium-emphasis">{{ t(key("identifiers_none")) }}</v-card-text>
      <v-table v-else density="compact">
        <thead>
          <tr>
            <th scope="col">{{ t(key("col_identifier")) }}</th>
            <th scope="col">{{ t(key("col_accounts_range")) }}</th>
            <th scope="col">{{ t(key("col_days_outside")) }}</th>
            <th scope="col">{{ t(key("col_use_per_day")) }}</th>
            <th scope="col">{{ t(key("col_observed")) }}</th>
            <th scope="col">{{ t(key("col_also_in")) }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="entry in entries" :key="entry.id">
            <tr v-if="entry.fold" class="fold-line">
              <td colspan="6">
                <v-btn variant="text" size="small" :aria-expanded="expanded ? 'true' : 'false'" @click="expanded = !expanded">
                  {{ expanded ? t(key("fold_hide")) : t(key("fold_show")) }}
                </v-btn>
                {{ foldText }}
              </td>
            </tr>
            <tr v-else class="identifier-row">
              <td>
                <identifier-chip :kind="entry.row.kind" :hash8="entry.row.hash8" :keys="entry.row.keys" :values="entry.row.values" />
                <div v-if="entry.row.machineNames && entry.row.machineNames.length > 0" class="text-body-2 text-medium-emphasis">{{ t(key("machine_names"), { names: entry.row.machineNames.join(", ") }) }}</div>
                <div v-if="entry.row.usernames && entry.row.usernames.length > 0" class="text-body-2 text-medium-emphasis">{{ t(key("usernames"), { names: entry.row.usernames.join(", ") }) }}</div>
              </td>
              <td class="text-no-wrap">
                <div>{{ accountsText(entry.row) }}</div>
                <accounts-dumbbell :during="entry.row.accountsDuring" :ever="entry.row.accountsEver" :scale="scale" />
              </td>
              <td class="text-no-wrap">
                <template v-if="entry.row.accountsEver">{{ daysOutsideText(entry.row) }}</template>
              </td>
              <td>
                <day-lane
                  v-if="entry.row.accountsEver && entry.row.days"
                  :days="entry.row.days"
                  :window="identifiers.window"
                  :lower-bound="entry.row.accountsEver.capped === true"
                />
              </td>
              <td class="observed">
                <template v-if="!entry.row.accountsEver">
                  <div>{{ t(key("no_day_history")) }}</div>
                  <div v-if="entry.row.span" class="text-body-2 text-medium-emphasis">
                    {{ t(key("span"), { from: formatUtc(entry.row.span.firstAt), to: formatUtc(entry.row.span.lastAt) }) }}
                  </div>
                </template>
                <div v-else-if="entry.row.observed === undefined" class="text-medium-emphasis">{{ t(key("observed_unknown")) }}</div>
                <div v-else-if="entry.row.observed.length === 0">{{ t(key("observed_event_only")) }}</div>
                <div v-for="side in entry.row.observed" :key="side" class="text-warning">
                  <span aria-hidden="true">&#9670;</span> {{ t(key(`observed_also_${side}`)) }}
                </div>
              </td>
              <td class="also-in">
                <v-btn v-for="e in entry.row.alsoIn" :key="e.id" variant="text" size="small" class="px-1" @click="emit('open-event', e.id)">{{ e.name }}</v-btn>
              </td>
            </tr>
          </template>
        </tbody>
      </v-table>
      <v-card-text v-if="identifiers.truncated" class="pt-2 pb-3 text-body-2 text-medium-emphasis" role="status">{{ t(key("identifiers_truncated")) }}</v-card-text>
    </template>
  </v-card>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { formatUtc } from "@/helpers/utc-dates";
import type { SmurfEventIdentifierRow, SmurfEventIdentifiers } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { factText } from "@/store/admin/smurfEvents/facts";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";
import AccountsDumbbell from "../smurf-detection/AccountsDumbbell.vue";
import DayLane from "../smurf-detection/DayLane.vue";
import { logAxis } from "../smurf-detection/day-lane";
import IdentifierChip from "../smurf-detection/IdentifierChip.vue";

const props = defineProps<{
  identifiers: SmurfEventIdentifiers | null;
  loading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  (e: "retry"): void;
  (e: "open-event", id: string): void;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});

const expanded = ref(false);

const rows = computed(() => props.identifiers?.rows ?? []);

/** Only an empty list of tags means "during the event only"; an absent one is not known. */
const eventOnly = computed(() => rows.value.filter((r) => r.observed !== undefined && r.observed.length === 0));
const openRows = computed(() => rows.value.filter((r) => !(r.observed !== undefined && r.observed.length === 0)));

type Entry = { id: string; fold: true } | { id: string; fold?: undefined; row: SmurfEventIdentifierRow };

const rowEntry = (row: SmurfEventIdentifierRow): Entry => ({ id: `${row.kind}:${row.hash8}`, row });

/** The rows in the order the server sent them, then the folded line, then the folded rows once opened. */
const entries = computed<Entry[]>(() => [
  ...openRows.value.map(rowEntry),
  ...(eventOnly.value.length > 0 ? [{ id: "fold", fold: true as const }] : []),
  ...(expanded.value ? eventOnly.value.map(rowEntry) : []),
]);

/** One axis for every row, from 1 to the largest count in the data. */
const scale = computed(() => logAxis(rows.value.flatMap((r) => [r.accountsDuring, r.accountsEver?.count ?? r.accountsDuring])));

/** A capped "ever" count means the server read only part of the accounts: the count during is a lower bound too. */
function accountsText(r: SmurfEventIdentifierRow): string {
  const during = factText(r.accountsDuring, r.accountsEver?.capped, tr);
  if (!r.accountsEver) return during;
  return t(key("accounts_range"), { during, ever: factText(r.accountsEver.count, r.accountsEver.capped, tr) });
}

function daysOutsideText(r: SmurfEventIdentifierRow): string {
  if (!r.daysOutside) return t(key("fact_unknown"));
  const capped = r.daysOutside.capped;
  return t(key("days_outside"), { before: factText(r.daysOutside.before, capped, tr), after: factText(r.daysOutside.after, capped, tr) });
}

/** "3 identifiers used during the event only (2 with 3 accounts, 1 with 5 accounts)". */
const foldText = computed(() => {
  const counts = new Map<number, number>();
  for (const r of eventOnly.value) counts.set(r.accountsDuring, (counts.get(r.accountsDuring) ?? 0) + 1);
  const groups = [...counts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([accounts, count]) => t(key(`fold_group_${accounts === 1 ? "one" : "other"}`), { count, accounts }));
  const total = eventOnly.value.length;
  return `${t(key(`fold_summary_${total === 1 ? "one" : "other"}`), { count: total })} (${groups.join(", ")})`;
});
</script>
