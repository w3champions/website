<template>
  <v-card v-if="loading || error || rows.length > 0" class="mb-4">
    <v-card-title class="text-subtitle-1 font-weight-bold">{{ t(key("venue_title")) }}</v-card-title>
    <v-card-text v-if="loading" class="text-medium-emphasis" role="status">{{ t(key("venue_loading")) }}</v-card-text>
    <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="mx-4 mb-4">
      {{ t(key("venue_failed")) }} {{ error }}
      <template v-slot:append>
        <v-btn class="retry" variant="text" size="small" @click="emit('retry')">{{ t(key("retry")) }}</v-btn>
      </template>
    </v-alert>
    <template v-else>
      <div v-for="entry in rows" :key="entry.id" class="venue-network px-4 py-3 border-t">
        <template v-if="entry.venue.source === 'ip'">
          <div class="mb-1">
            <identifier-chip kind="ip" :hash8="entry.venue.network.hash8" />
            <span v-if="entry.venue.network.provider !== undefined || entry.venue.network.country !== undefined" class="ml-2 text-medium-emphasis">
              <i18n-t :keypath="key('venue_context')" tag="span">
                <template v-slot:provider>
                  <template v-if="entry.venue.network.provider !== undefined">{{ entry.venue.network.provider }}</template>
                  <not-recorded v-else />
                </template>
                <template v-slot:country>
                  <template v-if="entry.venue.network.country !== undefined">{{ entry.venue.network.country }}</template>
                  <not-recorded v-else />
                </template>
              </i18n-t>
            </span>
          </div>
          <div v-if="entry.venue.network.notRead" class="text-medium-emphasis">{{ t(key("presence_not_read")) }}</div>
          <template v-else>
            <div>
              <i18n-t :keypath="key('venue_first_last')" tag="span">
                <template v-slot:first>
                  <template v-if="entry.venue.network.firstUseAt">{{ formatUtc(entry.venue.network.firstUseAt) }}</template>
                  <not-recorded v-else />
                </template>
                <template v-slot:last>
                  <template v-if="entry.venue.network.lastUseAt">{{ formatUtc(entry.venue.network.lastUseAt) }}</template>
                  <not-recorded v-else />
                </template>
              </i18n-t>
            </div>
            <div v-for="side in SIDES" :key="side">
              <template v-if="entry.venue.network[side]">{{ sideText(entry.venue.network[side], side, tr) }}</template>
              <not-recorded v-else />
            </div>
            <day-lane v-if="entry.venue.network.days && presence" :days="entry.venue.network.days" :window="presence.window" :lower-bound="anyCapped(entry.venue.network)" class="mt-1" />
          </template>
        </template>
        <template v-else>
          <div class="mb-1">
            <identifier-chip :kind="entry.venue.row.kind" :hash8="entry.venue.row.hash8" :keys="entry.venue.row.keys" :values="entry.venue.row.values" />
          </div>
          <div>
            <template v-if="entry.venue.row.holdersOutside">
              {{ t(key("venue_outside"), outsideCounts(entry.venue.row.holdersOutside)) }}
            </template>
            <not-recorded v-else />
          </div>
          <day-lane
            v-if="entry.venue.row.days && entry.venue.row.accountsEver && identifiers"
            :days="entry.venue.row.days"
            :window="identifiers.window"
            :lower-bound="entry.venue.row.accountsEver.capped === true"
            class="mt-1"
          />
        </template>
      </div>
    </template>
  </v-card>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { formatUtc } from "@/helpers/utc-dates";
import type { SmurfEventIdentifierRow, SmurfEventIdentifiers, SmurfEventNetworkPresence, SmurfEventPresence } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { factText } from "@/store/admin/smurfEvents/facts";
import { sideText, venueRows, type VenueRow } from "@/store/admin/smurfEvents/presence";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";
import DayLane from "../smurf-detection/DayLane.vue";
import IdentifierChip from "../smurf-detection/IdentifierChip.vue";
import NotRecorded from "./NotRecorded.vue";

const SIDES = ["before", "during", "after"] as const;

const props = defineProps<{
  presence: SmurfEventPresence | null;
  identifiers: SmurfEventIdentifiers | null;
  loading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  (e: "retry"): void;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});

const rows = computed(() => venueRows(props.presence, props.identifiers).map((venue: VenueRow) => ({ id: `${venue.source === "ip" ? "ip" : venue.row.kind}:${venue.source === "ip" ? venue.network.hash8 : venue.row.hash8}`, venue })));

function anyCapped(network: SmurfEventNetworkPresence): boolean {
  return SIDES.some((side) => network[side]?.capped === true);
}

function outsideCounts(holders: NonNullable<SmurfEventIdentifierRow["holdersOutside"]>): Record<string, string> {
  return { attendees: factText(holders.attendees, holders.capped, tr), others: factText(holders.others, holders.capped, tr) };
}
</script>
