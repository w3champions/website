<template>
  <v-card variant="outlined">
    <v-card-title class="text-subtitle-1 d-flex align-center">
      Audit log
      <v-spacer />
      <v-btn variant="text" size="small" :prepend-icon="mdiRefresh" :disabled="store.auditLoading" @click="store.loadAudit()">
        Refresh
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-alert v-if="store.auditError" type="error" variant="tonal" density="compact" class="mb-2">
        {{ store.auditError }}
      </v-alert>
      <v-data-table
        :headers="headers"
        :items="store.audit"
        :loading="store.auditLoading"
        :items-per-page="25"
        :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
        item-value="id"
        density="compact"
        no-data-text="No audit entries."
      >
        <template v-slot:[`item.at`]="{ item }">
          {{ formatUtc(item.at) }}
        </template>

        <template v-slot:[`item.actor`]="{ item }">
          {{ item.actor }}
          <span class="text-caption text-medium-emphasis">({{ item.actorRole }})</span>
        </template>

        <template v-slot:[`item.action`]="{ item }">
          {{ auditActionLabel(item.action) }}
        </template>

        <template v-slot:[`item.details`]="{ item }">
          {{ auditDetailsSummary(item.details) }}
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { mdiRefresh } from "@mdi/js";
import type { DataTableHeader } from "vuetify";
import { formatUtc } from "@/store/admin/commercialEvents/dates";
import { useCommercialEventDetailStore } from "@/store/admin/commercialEvents/eventDetailStore";
import { auditActionLabel, auditDetailsSummary } from "@/store/admin/commercialEvents/format";

const store = useCommercialEventDetailStore();

const headers: DataTableHeader[] = [
  { title: "When (UTC)", value: "at", sortable: false },
  { title: "Who", value: "actor", sortable: false },
  { title: "Action", value: "action", sortable: false },
  { title: "Details", value: "details", sortable: false },
];
</script>
