<template>
  <v-card class="mb-4">
    <v-card-title class="text-subtitle-1 font-weight-bold">{{ t(key("facts_title")) }}</v-card-title>
    <v-table density="compact">
      <tbody>
        <tr v-for="row in rows" :key="row.label">
          <td>{{ row.label }}</td>
          <td class="text-right font-weight-bold">
            <span v-if="row.notRecorded" class="not-recorded text-medium-emphasis">{{ t(key("facts_not_recorded")) }}</span>
            <template v-else>{{ row.value }}</template>
            <div v-if="row.names && row.names.length > 0" class="text-body-2 font-weight-regular">{{ row.names.join(", ") }}</div>
          </td>
        </tr>
      </tbody>
    </v-table>
    <div v-if="recordedLines.length > 0" class="px-4 pt-2 pb-3 text-body-2 text-medium-emphasis">
      <div v-for="line in recordedLines" :key="line">{{ line }}</div>
    </div>
  </v-card>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { formatUtc } from "@/helpers/utc-dates";
import type { SmurfEventDetail } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { factText } from "@/store/admin/smurfEvents/facts";
import { countText } from "@/store/admin/smurfEvents/labels";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";

const props = defineProps<{
  event: SmurfEventDetail;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});

interface FactRow {
  label: string;
  value: string;
  /** The row is about evidence the server did not record for this event: a hatch, never a number. */
  notRecorded?: boolean;
  names?: string[];
}

const rows = computed<FactRow[]>(() => {
  const e = props.event;
  const facts = e.facts;
  // Computed facts without the figure: no identifier has a day history. Facts not computed: unknown.
  const max = facts?.maxAccountsEver === undefined ? t(key("facts_no_day_history")) : factText(facts.maxAccountsEver, facts.maxAccountsEverCapped, tr);
  const identifiers = facts === undefined ? factText(undefined, undefined, tr) : t(key("facts_identifiers_value"), { identifiers: facts.identifiers, max });
  const accounts = countText("facts_accounts", facts?.attendees ?? e.counts.attendees, tr);
  const homes = e.counts.homes === undefined
    ? t(key("facts_homes_unknown"), { accounts, unknown: factText(undefined, undefined, tr) })
    : t(key("facts_homes_value"), { accounts, homes: countText("facts_separate_homes", e.counts.homes, tr) });
  const links = facts?.liveLinks === undefined
    ? factText(facts?.endedLinks, undefined, tr)
    : t(key("facts_links_with_live"), { ended: facts.endedLinks, live: factText(facts.liveLinks, facts.liveLinksCapped, tr) });
  // The rows above are fed by the facts: a 0 is a fact and absent facts are a dash. The evidence rows always render: when the evidence was not recorded for the event they read "Not recorded".
  const evidence = (label: string, value: number): FactRow => ({ label, value: String(value), notRecorded: !e.evidenceRecorded });
  return [
    { label: t(key("facts_networks")), value: facts?.networks === 0 ? t(key("facts_no_network")) : factText(facts?.networks, undefined, tr) },
    { label: t(key("facts_identifiers")), value: identifiers },
    { label: t(key("facts_homes")), value: homes },
    { label: t(key("facts_links")), value: links },
    { label: t(key("facts_not_counted")), value: factText(facts?.notCounted, undefined, tr), names: e.notCounted },
    evidence(t(key("evidence_days_before")), e.evidence.networkDaysBefore),
    evidence(t(key("evidence_days_after")), e.evidence.networkDaysAfter),
    evidence(t(key("evidence_returning")), e.evidence.returningAttendees),
  ];
});

const recordedLines = computed(() => {
  // A server that sends no `recorded` block records nothing to report.
  const { hardwareKeysSince, deviceMemorySince } = props.event.recorded ?? {};
  return [
    ...(hardwareKeysSince ? [t(key("facts_recorded_keys"), { date: formatUtc(hardwareKeysSince) })] : []),
    ...(deviceMemorySince ? [t(key("facts_recorded_memory"), { date: formatUtc(deviceMemorySince) })] : []),
  ];
});
</script>

<style scoped>
.not-recorded {
  display: inline-block;
  padding: 0 8px;
  border-radius: 2px;
  font-weight: 400;
  background: repeating-linear-gradient(135deg, transparent 0 4px, rgba(var(--v-theme-on-surface), 0.12) 4px 6px);
}
</style>
