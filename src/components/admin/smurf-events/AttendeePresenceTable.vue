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
        <th scope="row" class="font-weight-regular">
          <account-link :battle-tag="a.battleTag" />
          <v-chip v-if="anchors.has(a.battleTag)" size="x-small" variant="tonal" class="ml-1" :prepend-icon="mdiAnchor">{{ t(key("anchor")) }}</v-chip>
        </th>
        <td v-if="a.notRead" colspan="4" class="text-medium-emphasis">{{ t(key("presence_not_read")) }}</td>
        <template v-else>
          <td>{{ entryText(a, tr) }}<not-recorded v-if="entryText(a, tr) === null" /></td>
          <td class="text-no-wrap">{{ loginsText(a, tr) }}<not-recorded v-if="loginsText(a, tr) === null" /></td>
          <td class="text-no-wrap">{{ switchText(a, tr) }}<not-recorded v-if="switchText(a, tr) === null" /></td>
          <td class="text-medium-emphasis">
            <div><not-recorded v-if="a.countries === undefined" /><template v-else>{{ listText(a.countries, tr) }}</template></div>
            <div><not-recorded v-if="a.providers === undefined" /><template v-else>{{ listText(a.providers, tr) }}</template></div>
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
import { entryText, listText, loginsText, switchText } from "@/store/admin/smurfEvents/presence";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";
import AccountLink from "./AccountLink.vue";
import NotRecorded from "./NotRecorded.vue";

defineProps<{
  presence: SmurfEventPresence;
  anchors: ReadonlySet<string>;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});
</script>
