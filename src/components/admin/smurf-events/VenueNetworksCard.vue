<template>
  <v-card class="mb-4">
    <v-card-title class="text-subtitle-1 font-weight-bold">{{ t(key("venue_title")) }}</v-card-title>
    <div v-if="partialAnswer" class="px-4 pb-2 text-body-2 text-medium-emphasis" role="status">{{ t(key("presence_truncated")) }}</div>
    <v-card-text v-if="loading" class="text-medium-emphasis" role="status">{{ t(key("venue_loading")) }}</v-card-text>
    <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="mx-4 mb-4">
      {{ t(key("venue_failed")) }} {{ error }}
      <template v-slot:append>
        <v-btn class="retry" variant="text" size="small" @click="emit('retry')">{{ t(key("retry")) }}</v-btn>
      </template>
    </v-alert>
    <template v-else-if="presence !== null">
      <ul class="venue-networks">
        <li v-for="venue in rows" :key="venueRowId(venue)" class="venue-network px-4 py-3 border-t">
          <template v-if="venue.source === 'ip'">
            <div class="mb-1">
              <identifier-chip kind="ip" :hash8="venue.network.hash8" />
              <span v-if="hasContext(venue.network)" class="venue-context ml-2 text-medium-emphasis">
                <i18n-t v-if="venue.network.provider === undefined && venue.network.country === undefined" :keypath="key('venue_context_not_recorded')" tag="span">
                  <template v-slot:value><not-recorded /></template>
                </i18n-t>
                <i18n-t v-else :keypath="key('venue_context')" tag="span">
                  <template v-slot:provider>
                    <template v-if="venue.network.provider !== undefined">{{ venue.network.provider }}</template>
                    <not-recorded v-else />
                  </template>
                  <template v-slot:country>
                    <template v-if="venue.network.country !== undefined">{{ venue.network.country }}</template>
                    <not-recorded v-else />
                  </template>
                </i18n-t>
              </span>
            </div>
            <i18n-t v-if="isUnmeasured(venue.network)" :keypath="key('venue_not_recorded')" tag="div">
              <template v-slot:value><not-recorded /></template>
            </i18n-t>
            <div v-else-if="venue.network.notRead" class="text-medium-emphasis">{{ t(key("presence_not_read")) }}</div>
            <template v-else>
              <div class="venue-first-last">
                <i18n-t :keypath="key('venue_first_last')" tag="span">
                  <template v-slot:first>{{ venue.network.firstUseAt ? formatUtc(venue.network.firstUseAt) : t(key("presence_not_read")) }}</template>
                  <template v-slot:last>{{ venue.network.lastUseAt ? formatUtc(venue.network.lastUseAt) : t(key("presence_not_read")) }}</template>
                </i18n-t>
              </div>
              <div v-for="side in SIDES" :key="side">{{ sideText(venue.network[side], side, tr) ?? t(key(`venue_side_not_read_${side}`)) }}</div>
              <day-lane v-if="venue.network.days && presence" :days="venue.network.days" :window="presence.window" :lower-bound="isLowerBound(venue.network)" class="mt-1" />
            </template>
          </template>
          <template v-else>
            <div class="mb-1">
              <identifier-chip :kind="venue.row.kind" :hash8="venue.row.hash8" :keys="venue.row.keys" :values="venue.row.values" />
            </div>
            <div class="venue-first-last">
              <i18n-t :keypath="key(isPartialRead(venue.row) ? 'venue_first_last_partial' : 'venue_first_last')" tag="span">
                <template v-slot:first>
                  <template v-if="venue.row.firstDay !== undefined">{{ dayText(venue.row.firstDay) }}</template>
                  <not-recorded v-else />
                </template>
                <template v-slot:last>
                  <template v-if="venue.row.lastDay !== undefined">{{ dayText(venue.row.lastDay) }}</template>
                  <not-recorded v-else />
                </template>
              </i18n-t>
            </div>
            <div v-if="venue.row.holdersOutside">{{ outsideText(venue.row.holdersOutside, tr) }}</div>
            <i18n-t v-else :keypath="key('venue_outside_not_recorded')" tag="div">
              <template v-slot:value><not-recorded /></template>
            </i18n-t>
            <day-lane
              v-if="venue.row.days && venue.row.accountsEver && identifiers"
              :days="venue.row.days"
              :window="identifiers.window"
              :lower-bound="venue.row.accountsEver.capped === true"
              class="mt-1"
            />
          </template>
        </li>
      </ul>
      <div v-if="showNotRecorded" class="px-4 pb-3"><not-recorded /></div>
      <div v-if="routersPending" class="px-4 pb-3 text-body-2 text-medium-emphasis" role="status">{{ t(key("venue_routers_pending")) }}</div>
      <div v-if="routersPartial" class="px-4 pb-3 text-body-2 text-medium-emphasis" role="status">{{ t(key("venue_routers_partial")) }}</div>
    </template>
  </v-card>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { formatUtc } from "@/helpers/utc-dates";
import type { SmurfEventIdentifierRow, SmurfEventIdentifiers, SmurfEventNetworkPresence, SmurfEventPresence } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { isUnmeasured, outsideText, sideText, venueRowId, venueRows } from "@/store/admin/smurfEvents/presence";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";
import { dayText } from "../smurf-detection/day-lane";
import DayLane from "../smurf-detection/DayLane.vue";
import IdentifierChip from "../smurf-detection/IdentifierChip.vue";
import NotRecorded from "./NotRecorded.vue";

const SIDES = ["before", "during", "after"] as const;

const props = defineProps<{
  presence: SmurfEventPresence | null;
  identifiers: SmurfEventIdentifiers | null;
  /** The event's venue networks of every kind: more than the IP rows means router networks that come with the identifier table. */
  networkCount: number;
  loading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  (e: "retry"): void;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});

const rows = computed(() => venueRows(props.presence, props.identifiers));

/** Part of the presence answer was not read (a network, an attendee, a side or a first / last use): said once, under the title. */
const partialAnswer = computed(() => !props.loading && props.error === null && props.presence?.truncated === true);

/** The presence is in but the identifier table is not (still loading, or it failed): the router networks cannot be listed yet. */
const routersPending = computed(() => props.presence !== null && props.identifiers === null && props.networkCount > props.presence.networks.length);

/** The identifier table is loaded but cut: the event has more venue networks than the card lists, so some router networks may be missing. */
const routersPartial = computed(() => props.identifiers?.truncated === true && props.networkCount > rows.value.length);

/** Rows are missing and nothing says why: only a loaded, complete identifier table makes the empty card "not recorded". */
const showNotRecorded = computed(() => rows.value.length === 0 && props.identifiers !== null && props.identifiers.truncated !== true);

/** The network has something to show next to its chip: a provider or a country, or the plain fact that it was measured with neither. */
function hasContext(network: SmurfEventNetworkPresence): boolean {
  return !isUnmeasured(network) && (network.notRead !== true || network.provider !== undefined || network.country !== undefined);
}

/** The day lane holds only what was read: a capped side, or a side that was not read, makes its numbers lower bounds. */
function isLowerBound(network: SmurfEventNetworkPresence): boolean {
  return SIDES.some((side) => network[side] === undefined || network[side].capped === true);
}

/** The server read only part of the holders of the row (and its first and last use, if any, are bounds of what was read). */
function isPartial(row: SmurfEventIdentifierRow): boolean {
  return row.accountsEver?.capped === true || row.holdersOutside?.capped === true;
}

/** The partial wording for first and last use applies when there is a day to qualify. */
function isPartialRead(row: SmurfEventIdentifierRow): boolean {
  return isPartial(row) && (row.firstDay !== undefined || row.lastDay !== undefined);
}
</script>

<style scoped>
.venue-networks {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
