<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      {{ t(key("audit")) }}
      <v-spacer />
      <v-btn variant="text" size="small" :prepend-icon="mdiRefresh" :disabled="store.auditLoading" @click="store.loadAudit()">
        {{ t(key("refresh")) }}
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-alert v-if="store.auditError" type="error" variant="tonal" density="compact" class="mb-2">
        {{ errorText(store.auditError, tr) }}
      </v-alert>
      <v-data-table
        :headers="headers"
        :items="store.audit"
        :loading="store.auditLoading"
        :items-per-page="-1"
        :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
        item-value="id"
        density="compact"
        hide-default-footer
        :no-data-text="t(key('no_audit'))"
      >
        <template v-slot:[`item.at`]="{ item }">{{ formatUtc(item.at) }}</template>
        <template v-slot:[`item.action`]="{ item }">{{ auditActionLabel(item.action, tr) }}</template>
        <template v-slot:[`item.target`]="{ item }">
          <span class="font-monospace text-caption">{{ auditTargetText(item.target) }}</span>
        </template>
        <template v-slot:[`item.reason`]="{ item }">{{ item.reason ?? t(key("dash")) }}</template>
        <template v-slot:[`item.outcome`]="{ item }">
          <span class="text-caption">{{ auditOutcomeText(item.outcome, tr) }}</span>
        </template>
      </v-data-table>
      <div v-if="store.auditNext !== null" class="d-flex justify-center mt-2">
        <v-btn variant="tonal" :loading="store.auditLoading" @click="store.loadMoreAudit()">
          {{ t(key("load_more")) }}
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { mdiRefresh } from "@mdi/js";
import type { DataTableHeader } from "vuetify";
import { formatUtc } from "@/helpers/utc-dates";
import { auditActionLabel, auditOutcomeText, auditTargetText } from "@/store/admin/hardwareSmurfs/audit";
import { errorText } from "@/store/admin/hardwareSmurfs/errors";
import { useHardwareSmurfsStore } from "@/store/admin/hardwareSmurfs/store";
import { key, type Translate } from "@/store/admin/hardwareSmurfs/translate";

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});
const store = useHardwareSmurfsStore();

const headers = computed<DataTableHeader[]>(() => [
  { title: t(key("col_when")), key: "at", sortable: false },
  { title: t(key("col_who")), key: "author", sortable: false },
  { title: t(key("col_action")), key: "action", sortable: false },
  { title: t(key("col_target")), key: "target", sortable: false },
  { title: t(key("col_audit_reason")), key: "reason", sortable: false },
  { title: t(key("col_outcome")), key: "outcome", sortable: false },
]);
</script>
