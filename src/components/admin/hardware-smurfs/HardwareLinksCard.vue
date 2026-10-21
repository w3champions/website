<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      {{ t(key("live_links")) }}
      <v-chip size="small" class="ml-2" variant="tonal">{{ store.liveLinks.length }}</v-chip>
      <v-spacer />
      <v-btn variant="text" size="small" :prepend-icon="mdiRefresh" :disabled="store.linksLoading" @click="store.loadLinks()">
        {{ t(key("refresh")) }}
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-alert v-if="store.linksError" type="error" variant="tonal" density="compact" class="mb-2">
        {{ errorText(store.linksError, tr) }}
      </v-alert>
      <v-data-table
        :headers="liveHeaders"
        :items="store.liveLinks"
        :loading="store.linksLoading"
        :items-per-page="25"
        :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
        item-value="_id"
        density="compact"
        :no-data-text="t(key('no_live_links'))"
      >
        <template v-slot:[`item.other`]="{ item }">
          <a href="#" class="font-weight-medium" @click.prevent="emit('openAccount', otherOf(item))">{{ otherOf(item) }}</a>
        </template>
        <template v-slot:[`item.source`]="{ item }">
          <v-chip size="small" variant="outlined">{{ sourceLabel(item.source, tr) }}</v-chip>
        </template>
        <template v-slot:[`item.createdAt`]="{ item }">{{ formatUtc(item.createdAt) }}</template>
        <template v-slot:[`item.lastConfirmedAt`]="{ item }">{{ formatUtc(item.lastConfirmedAt) }}</template>
        <template v-slot:[`item.report`]="{ item }">{{ reportStatusLabel(item, tr) }}</template>
        <template v-slot:[`item.verdict`]="{ item }">
          <verdict-cell :link="item" />
        </template>
        <template v-slot:[`item.evidence`]="{ item }">
          <v-chip
            v-for="m in item.evidence?.matched ?? []"
            :key="m.hash8"
            size="x-small"
            class="mr-1 my-1 font-monospace"
            variant="tonal"
          >
            {{ m.kind }} {{ m.hash8 }}
          </v-chip>
          <span v-if="(item.evidence?.matched ?? []).length === 0" class="text-medium-emphasis">{{ t(key("dash")) }}</span>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <action-buttons :options="pairActions(item, canAdminister)" @select="(o) => emit('action', o, otherOf(item))" />
        </template>
      </v-data-table>
    </v-card-text>

    <v-divider />

    <v-card-title class="d-flex align-center text-subtitle-1">
      {{ t(key("tombstones")) }}
      <v-chip size="small" class="ml-2" variant="tonal">{{ store.tombstones.length }}</v-chip>
    </v-card-title>
    <v-card-text>
      <v-data-table
        :headers="tombstoneHeaders"
        :items="store.tombstones"
        :loading="store.linksLoading"
        :items-per-page="10"
        :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
        item-value="_id"
        density="compact"
        :no-data-text="t(key('no_tombstones'))"
      >
        <template v-slot:[`item.other`]="{ item }">
          <a href="#" @click.prevent="emit('openAccount', otherOf(item))">{{ otherOf(item) }}</a>
        </template>
        <template v-slot:[`item.reason`]="{ item }">{{ tombstoneReasonLabel(item.invalidReason, tr) }}</template>
        <template v-slot:[`item.invalidatedAt`]="{ item }">{{ formatUtc(item.invalidatedAt) }}</template>
        <template v-slot:[`item.verdict`]="{ item }">
          <verdict-cell :link="item" />
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <action-buttons :options="pairActions(item, canAdminister)" @select="(o) => emit('action', o, otherOf(item))" />
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { mdiRefresh } from "@mdi/js";
import type { DataTableHeader } from "vuetify";
import { formatUtc } from "@/helpers/utc-dates";
import type { HardwareLink } from "@/services/admin/smurf-detection/HardwareSmurfResponse";
import { type ActionOption, pairActions, type PairAction } from "@/store/admin/hardwareSmurfs/actions";
import { errorText } from "@/store/admin/hardwareSmurfs/errors";
import { reportStatusLabel, sourceLabel, tombstoneReasonLabel } from "@/store/admin/hardwareSmurfs/labels";
import { useHardwareSmurfsStore } from "@/store/admin/hardwareSmurfs/store";
import { key, type Translate } from "@/store/admin/hardwareSmurfs/translate";
import ActionButtons from "./ActionButtons.vue";
import VerdictCell from "./VerdictCell.vue";

defineProps<{ canAdminister: boolean }>();

const emit = defineEmits<{
  (e: "action", option: ActionOption<PairAction>, other: string): void;
  (e: "openAccount", battleTag: string): void;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});
const store = useHardwareSmurfsStore();

function otherOf(link: HardwareLink): string {
  return link.a === store.battleTag ? link.b : link.a;
}

const liveHeaders = computed<DataTableHeader[]>(() => [
  { title: t(key("col_account")), key: "other", sortable: false },
  { title: t(key("col_source")), key: "source", sortable: false },
  { title: t(key("col_created")), key: "createdAt", sortable: false },
  { title: t(key("col_last_confirmed")), key: "lastConfirmedAt", sortable: false },
  { title: t(key("col_report")), key: "report", sortable: false },
  { title: t(key("col_verdict")), key: "verdict", sortable: false },
  { title: t(key("col_evidence")), key: "evidence", sortable: false },
  { title: t(key("col_actions")), key: "actions", sortable: false, align: "end" },
]);

const tombstoneHeaders = computed<DataTableHeader[]>(() => [
  { title: t(key("col_account")), key: "other", sortable: false },
  { title: t(key("col_reason")), key: "reason", sortable: false },
  { title: t(key("col_ended")), key: "invalidatedAt", sortable: false },
  { title: t(key("col_verdict")), key: "verdict", sortable: false },
  { title: t(key("col_actions")), key: "actions", sortable: false, align: "end" },
]);
</script>
