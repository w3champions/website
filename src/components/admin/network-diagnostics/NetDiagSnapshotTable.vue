<template>
  <v-table density="compact">
    <thead>
      <tr>
        <th>Node</th>
        <th>Route</th>
        <th>Transport</th>
        <th>Health</th>
        <th class="text-end">Current</th>
        <th class="text-end">Avg</th>
        <th class="text-end">p50</th>
        <th class="text-end">p90</th>
        <th class="text-end" title="flo's max is the 95th percentile on purpose">p95 (flo max)</th>
        <th class="text-end">p99</th>
        <th class="text-end">True max</th>
        <th class="text-end">Loss</th>
        <th class="text-end">Samples</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, index) in viewRows" :key="index">
        <td>{{ row.node }}</td>
        <td class="text-caption">{{ row.route }}</td>
        <td>{{ row.transport }}</td>
        <td>
          <v-chip size="x-small" variant="tonal" :color="row.isHealthy ? 'success' : 'error'">{{ row.health }}</v-chip>
        </td>
        <td class="text-end">{{ row.current }}</td>
        <td class="text-end">{{ row.avg }}</td>
        <td class="text-end">{{ row.p50 }}</td>
        <td class="text-end">{{ row.p90 }}</td>
        <td class="text-end">{{ row.p95 }}</td>
        <td class="text-end">{{ row.p99 }}</td>
        <td class="text-end">{{ row.maxTrue }}</td>
        <td class="text-end">{{ row.loss }}</td>
        <td class="text-end">{{ row.samples }}</td>
      </tr>
      <tr v-if="viewRows.length === 0">
        <td colspan="13" class="text-center text-medium-emphasis">No flo ping snapshot in this measurement.</td>
      </tr>
    </tbody>
  </v-table>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import type { FloSnapshotRow } from "@/store/admin/networkDiagnostics/types";
import { snapshotRows } from "./measurementView";

const props = defineProps<{ rows: FloSnapshotRow[] }>();

const viewRows = computed(() => snapshotRows(props.rows));
</script>
