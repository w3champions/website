<template>
  <v-card class="mb-4">
    <v-card-title class="text-subtitle-1 font-weight-bold">{{ t(key("venue_title")) }}</v-card-title>
    <v-card-text v-if="loading" class="text-medium-emphasis" role="status">{{ t(key("venue_loading")) }}</v-card-text>
    <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="mx-4 mb-4">
      {{ t(key("venue_failed")) }} {{ error }}
      <template v-slot:append>
        <v-btn class="retry" variant="text" size="small" @click="emit('retry')">{{ t(key("retry")) }}</v-btn>
      </template>
    </v-alert>
    <template v-else>
      <div v-for="venue in rows" :key="venueRowId(venue)" class="venue-network px-4 py-3 border-t">
        <template v-if="venue.source === 'ip'">
          <div class="mb-1">
            <identifier-chip kind="ip" :hash8="venue.network.hash8" />
            <template v-if="isUnmeasured(venue.network)">
              <not-recorded class="ml-2" />
            </template>
            <span v-else-if="!venue.network.notRead || venue.network.provider !== undefined || venue.network.country !== undefined" class="venue-context ml-2 text-medium-emphasis">
              <not-recorded v-if="venue.network.provider === undefined && venue.network.country === undefined" />
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
          <div v-if="venue.network.notRead" class="text-medium-emphasis">{{ t(key("presence_not_read")) }}</div>
          <template v-else-if="!isUnmeasured(venue.network)">
            <div>
              <i18n-t :keypath="key('venue_first_last')" tag="span">
                <template v-slot:first>
                  <template v-if="venue.network.firstUseAt">{{ formatUtc(venue.network.firstUseAt) }}</template>
                  <not-recorded v-else />
                </template>
                <template v-slot:last>
                  <template v-if="venue.network.lastUseAt">{{ formatUtc(venue.network.lastUseAt) }}</template>
                  <not-recorded v-else />
                </template>
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
            <not-recorded v-if="venue.row.firstDay === undefined && venue.row.lastDay === undefined" />
            <i18n-t v-else :keypath="key(isPartial(venue.row) ? 'venue_first_last_partial' : 'venue_first_last')" tag="span">
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
          <div>
            <template v-if="venue.row.holdersOutside">{{ t(key("venue_outside"), outsideCounts(venue.row.holdersOutside)) }}</template>
            <not-recorded v-else />
          </div>
          <day-lane
            v-if="venue.row.days && venue.row.accountsEver && identifiers"
            :days="venue.row.days"
            :window="identifiers.window"
            :lower-bound="venue.row.accountsEver.capped === true"
            class="mt-1"
          />
        </template>
      </div>
      <div v-if="rows.length === 0 && !routersPending" class="px-4 pb-3"><not-recorded /></div>
      <div v-if="routersPending" class="px-4 pb-3 text-body-2 text-medium-emphasis" role="status">{{ t(key("venue_routers_pending")) }}</div>
    </template>
  </v-card>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { formatUtc } from "@/helpers/utc-dates";
import type { SmurfEventIdentifierRow, SmurfEventIdentifiers, SmurfEventNetworkPresence, SmurfEventPresence } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { factText } from "@/store/admin/smurfEvents/facts";
import { isUnmeasured, sideText, venueRowId, venueRows } from "@/store/admin/smurfEvents/presence";
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

/** The presence is in but the identifier table is not: the router networks cannot be listed yet. */
const routersPending = computed(() => props.presence !== null && props.identifiers === null && props.networkCount > props.presence.networks.length);

/** The day lane holds only what was read: a capped side, or a side that was not read, makes its numbers lower bounds. */
function isLowerBound(network: SmurfEventNetworkPresence): boolean {
  return SIDES.some((side) => network[side] === undefined || network[side].capped === true);
}

/** The server read only part of the holders of the row: its first and last use are bounds of what was read. */
function isPartial(row: SmurfEventIdentifierRow): boolean {
  return row.accountsEver?.capped === true || row.holdersOutside?.capped === true;
}

/** The attendee count is exact even on a capped row; only the other accounts are a lower bound. */
function outsideCounts(holders: NonNullable<SmurfEventIdentifierRow["holdersOutside"]>): Record<string, string> {
  return { attendees: String(holders.attendees), others: factText(holders.others, holders.capped, tr) };
}
</script>
