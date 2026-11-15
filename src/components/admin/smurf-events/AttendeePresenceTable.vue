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
      <tr v-for="row in rows" :key="row.battleTag">
        <td>
          <account-link :battle-tag="row.battleTag" />
          <v-chip v-if="row.anchor" size="x-small" variant="tonal" class="ml-1" :prepend-icon="mdiAnchor">{{ t(key("anchor")) }}</v-chip>
        </td>
        <td v-if="row.notRead" colspan="4" class="text-medium-emphasis">{{ t(key("presence_not_read")) }}</td>
        <template v-else>
          <td>
            <template v-if="row.entry !== null">{{ row.entry }}</template>
            <not-recorded v-else />
          </td>
          <td class="text-no-wrap">
            <template v-if="row.logins !== null">{{ row.logins }}</template>
            <not-recorded v-else />
          </td>
          <td class="text-no-wrap">
            <template v-if="row.switch !== null">{{ row.switch }}</template>
            <not-recorded v-else />
          </td>
          <td class="text-medium-emphasis">
            <div>
              <template v-if="row.countries !== null">{{ row.countries }}</template>
              <not-recorded v-else />
            </div>
            <div>
              <template v-if="row.providers !== null">{{ row.providers }}</template>
              <not-recorded v-else />
            </div>
          </td>
        </template>
      </tr>
    </tbody>
  </v-table>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { mdiAnchor } from "@mdi/js";
import type { SmurfEventPresence } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { entryText, listText, loginsText, switchText } from "@/store/admin/smurfEvents/presence";
import { key, type Translate } from "@/store/admin/smurfEvents/translate";
import AccountLink from "./AccountLink.vue";
import NotRecorded from "./NotRecorded.vue";

const props = defineProps<{
  presence: SmurfEventPresence;
  anchors: ReadonlySet<string>;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});

/** Each attendee's cell texts, worked out once; null: not recorded. */
const rows = computed(() =>
  props.presence.attendees.map((a) => ({
    battleTag: a.battleTag,
    anchor: props.anchors.has(a.battleTag),
    notRead: a.notRead === true,
    entry: entryText(a, tr),
    logins: loginsText(a, tr),
    switch: switchText(a, tr),
    countries: a.countries === undefined ? null : listText(a.countries, tr),
    providers: a.providers === undefined ? null : listText(a.providers, tr),
  }))
);
</script>
