<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      {{ t(key("items")) }}
      <v-chip size="small" class="ml-2" variant="tonal">{{ store.items.length }}</v-chip>
      <v-spacer />
      <v-btn variant="text" size="small" :prepend-icon="mdiRefresh" :disabled="store.itemsLoading" @click="store.loadItems()">
        {{ t(key("refresh")) }}
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-alert v-if="store.itemsError" type="error" variant="tonal" density="compact" class="mb-2">
        {{ errorText(store.itemsError, tr) }}
      </v-alert>
      <v-data-table
        :headers="headers"
        :items="store.items"
        :loading="store.itemsLoading"
        :items-per-page="25"
        :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
        :item-value="(item: HardwareProfileItemView) => `${item.kind}:${item.hash8}`"
        density="compact"
        :no-data-text="store.noProfile ? t(key('no_profile')) : t(key('no_items'))"
      >
        <template v-slot:[`item.hash8`]="{ item }">
          <span class="font-monospace">{{ item.hash8 }}</span>
        </template>
        <template v-slot:[`item.sightings`]="{ item }">
          {{ t(key("sightings"), { first: formatUtc(item.first), last: formatUtc(item.last) }) }}
        </template>
        <template v-slot:[`item.flags`]="{ item }">
          <v-chip
            v-for="flag in itemFlagLabels(item, tr)"
            :key="flag.id"
            size="x-small"
            class="mr-1 my-1"
            :color="flag.color"
            variant="tonal"
          >
            {{ flag.label }}
          </v-chip>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <action-buttons :options="itemActions(item, canAdminister)" @select="(o) => emit('action', o, item)" />
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
import type { HardwareProfileItemView } from "@/services/admin/smurf-detection/HardwareSmurfResponse";
import { type ActionOption, type ItemAction, itemActions } from "@/store/admin/hardwareSmurfs/actions";
import { errorText } from "@/store/admin/hardwareSmurfs/errors";
import { itemFlagLabels } from "@/store/admin/hardwareSmurfs/labels";
import { useHardwareSmurfsStore } from "@/store/admin/hardwareSmurfs/store";
import { key, type Translate } from "@/store/admin/hardwareSmurfs/translate";
import ActionButtons from "./ActionButtons.vue";

defineProps<{ canAdminister: boolean }>();

const emit = defineEmits<{
  (e: "action", option: ActionOption<ItemAction>, item: HardwareProfileItemView): void;
}>();

const { t } = useI18n();
const tr: Translate = (k, named) => t(k, named ?? {});
const store = useHardwareSmurfsStore();

const headers = computed<DataTableHeader[]>(() => [
  { title: t(key("col_kind")), key: "kind", sortable: true },
  { title: t(key("col_tier")), key: "tier", sortable: true },
  { title: t(key("col_hash8")), key: "hash8", sortable: false },
  { title: t(key("col_sightings")), key: "sightings", sortable: false },
  { title: t(key("col_logins")), key: "logins", sortable: true },
  { title: t(key("col_flags")), key: "flags", sortable: false },
  { title: t(key("col_actions")), key: "actions", sortable: false, align: "end" },
]);
</script>
