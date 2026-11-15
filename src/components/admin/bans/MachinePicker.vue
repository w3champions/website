<template>
  <div class="machine-picker mb-4">
    <v-table density="compact" class="picker-table">
      <thead>
        <tr>
          <th class="picker-col-tick"></th>
          <th class="picker-col-id text-medium-emphasis font-weight-bold">{{ t(key("picker_col_id")) }}</th>
          <th class="picker-col-last-used text-medium-emphasis font-weight-bold">{{ t(key("picker_col_last_used")) }}</th>
          <th class="picker-col-others text-medium-emphasis font-weight-bold">{{ t(key("picker_col_others")) }}</th>
          <th class="text-medium-emphasis font-weight-bold">{{ t(key("picker_col_note")) }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="view in rows" :key="view.row.machineId">
          <tr :data-machine-id="view.row.machineId">
            <td>
              <v-checkbox-btn
                :model-value="view.ticked"
                :aria-label="t(key('picker_include'), { id: view.row.machineId })"
                color="primary"
                density="compact"
                @update:model-value="emit('update:modelValue', toggleId(modelValue, view.row.machineId))"
              />
            </td>
            <td class="picker-cell"><code class="picker-id" :title="view.row.machineId">{{ view.row.machineId }}</code></td>
            <td class="picker-cell">{{ lastUsedText(view.row, new Date(), tr) }}</td>
            <td class="picker-cell">
              <v-btn
                v-if="view.row.otherAccountCount > 0"
                variant="text"
                size="small"
                color="primary"
                :aria-expanded="expanded.includes(view.row.machineId)"
                @click="toggleOthers(view.row.machineId)"
              >
                {{ otherAccountsText(view.row) }}
              </v-btn>
              <span v-else>{{ otherAccountsText(view.row) }}</span>
            </td>
            <td class="picker-cell text-medium-emphasis">{{ rowNote(view, tr) }}</td>
          </tr>
          <tr v-if="expanded.includes(view.row.machineId)" class="picker-others-row">
            <td></td>
            <td colspan="4"><MachineIdAccounts :machine-id="view.row.machineId" /></td>
          </tr>
        </template>
      </tbody>
    </v-table>
    <v-btn v-if="olderCount > 0" variant="text" size="small" color="primary" class="mt-1" @click="emit('update:modelValue', revealOlder(modelValue))">
      {{ countText("picker_show_older", olderCount, tr) }}
    </v-btn>
    <div class="picker-footer d-flex align-center flex-wrap ga-2 mt-2 text-body-2">
      <span class="picker-footer-text" :class="{ 'text-warning': collateral }">{{ footerText }}</span>
      <v-spacer />
      <v-btn v-if="modelValue.mode === 'add'" variant="text" size="small" @click="emit('update:modelValue', selectRecommended(modelValue))">
        {{ t(key("picker_recommended")) }}
      </v-btn>
      <v-btn v-else variant="text" size="small" @click="emit('update:modelValue', resetToSaved(modelValue))">
        {{ t(key("picker_reset")) }}
      </v-btn>
      <v-btn variant="text" size="small" @click="emit('update:modelValue', selectNone(modelValue))">
        {{ t(key("picker_none")) }}
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useBanFormat } from "@/composables/useBanFormat";
import { useBanDialogStore } from "@/store/admin/bans/dialogStore";
import {
  hiddenOlderCount,
  impactIds,
  lastUsedText,
  otherAccountsText,
  pickerFooterText,
  pickerSummary,
  type PickerState,
  resetToSaved,
  revealOlder,
  rowNote,
  selectNone,
  selectRecommended,
  toggleId,
  visibleRows,
} from "@/store/admin/bans/machinePicker";
import { countText, key } from "@/store/admin/bans/translate";
import MachineIdAccounts from "./MachineIdAccounts.vue";

const props = defineProps<{ modelValue: PickerState }>();
const emit = defineEmits<{ (e: "update:modelValue", state: PickerState): void }>();

const { t } = useI18n();
const { tr } = useBanFormat();
const dialogStore = useBanDialogStore();

const expanded = ref<string[]>([]);
/** IDs whose other accounts were asked for already; they load once per picker. */
let requested: readonly string[] = [];

// The clock is read again whenever the state changes.
const rows = computed(() => visibleRows(props.modelValue, new Date()));
const olderCount = computed(() => hiddenOlderCount(props.modelValue, new Date()));
const collateral = computed(() => (dialogStore.impact?.otherAccounts ?? 0) > 0);
const footerText = computed(() => pickerFooterText(pickerSummary(props.modelValue), dialogStore.impact, props.modelValue.mode, tr));

function toggleOthers(machineId: string): void {
  if (expanded.value.includes(machineId)) {
    expanded.value = expanded.value.filter((id) => id !== machineId);
    return;
  }
  expanded.value = [...expanded.value, machineId];
  if (!requested.includes(machineId)) {
    requested = [...requested, machineId];
    void dialogStore.loadOtherAccounts(machineId);
  }
}

watch(() => impactIds(props.modelValue).join(" "), () => {
  void dialogStore.loadImpact(impactIds(props.modelValue));
}, { immediate: true });
</script>

<style scoped>
.picker-table :deep(table) {
  table-layout: fixed;
}
.picker-col-tick {
  width: 48px;
}
.picker-col-id {
  width: 128px;
}
.picker-col-last-used {
  width: 184px;
}
.picker-col-others {
  width: 120px;
}
.picker-cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.picker-id {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
</style>
