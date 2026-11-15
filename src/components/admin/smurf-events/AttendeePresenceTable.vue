<template>
  <v-table density="compact">
    <thead>
      <tr>
        <th scope="col">{{ t(key("col_attendee")) }}</th>
        <th scope="col">{{ t(key("col_entry")) }}</th>
        <th scope="col">{{ t(key("col_logins")) }}</th>
        <th scope="col">{{ t(key("col_switch")) }}</th>
        <th scope="col">{{ t(key("col_where")) }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="a in presence.attendees" :key="a.battleTag">
        <td>
          <router-link :to="hardwareLink(a.battleTag)" class="account-link">{{ a.battleTag }}</router-link>
          <v-chip v-if="anchors.has(a.battleTag)" size="x-small" variant="tonal" class="ml-1" :prepend-icon="mdiAnchor">{{ t(key("anchor")) }}</v-chip>
        </td>
        <td v-if="a.notRead" colspan="4" class="text-medium-emphasis">{{ t(key("presence_not_read")) }}</td>
        <template v-else>
          <td><not-recorded v-if="a.entry === undefined" /><template v-else>{{ entryText(a, tr) }}</template></td>
          <td class="text-no-wrap"><not-recorded v-if="a.venueLogins === undefined || a.elsewhere === undefined" /><template v-else>{{ loginsText(a, tr) }}</template></td>
          <td class="text-no-wrap"><not-recorded v-if="a.nearestSwitchMinutes === undefined && a.samePcRecorded === undefined" /><template v-else>{{ switchText(a, tr) }}</template></td>
          <td class="text-medium-emphasis">
            <div><not-recorded v-if="a.countries === undefined" /><template v-else>{{ listText(a.countries) }}</template></div>
            <div><not-recorded v-if="a.providers === undefined" /><template v-else>{{ listText(a.providers) }}</template></div>
          </td>
        </template>
      </tr>
    </tbody>
  </v-table>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { mdiAnchor } from "@mdi/js";
import type { SmurfEventPresence } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { entryText, hardwareLink, loginsText, switchText } from "@/store/admin/smurfEvents/presence";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";
import NotRecorded from "./NotRecorded.vue";

defineProps<{
  presence: SmurfEventPresence;
  anchors: ReadonlySet<string>;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});

/** A recorded list: its items, or "None" when the server recorded it empty. */
function listText(values: string[]): string {
  return values.length === 0 ? t(key("spread_none")) : values.join(", ");
}
</script>

<style scoped>
.account-link {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.account-link:hover {
  text-decoration: underline;
}

.account-link:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>
