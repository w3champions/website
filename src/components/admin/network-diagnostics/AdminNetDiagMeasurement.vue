<template>
  <div>
    <v-card-title class="pt-3 d-flex align-center flex-wrap ga-2">
      <v-btn v-if="detail" icon variant="text" size="small" aria-label="Back to the run" :to="{ name: EAdminRouteName.NETDIAG_RUN_DETAIL, params: { runId: detail.runId } }">
        <v-icon>{{ mdiArrowLeft }}</v-icon>
      </v-btn>
      <span>Measurement</span>
      <code class="text-caption">{{ measurementId }}</code>
      <v-spacer />
      <v-btn
        v-if="detail && !store.detailRaw"
        variant="outlined"
        color="primary"
        :prepend-icon="mdiChartLine"
        :loading="store.detailLoading"
        @click="loadRaw"
      >
        Load RTT time-series
      </v-btn>
    </v-card-title>

    <v-container>
      <v-alert v-if="store.detailError" type="error" variant="tonal" density="compact" class="mb-4">{{ store.detailError }}</v-alert>
      <v-skeleton-loader v-if="!detail && store.detailLoading" type="article, table" />

      <template v-if="detail">
        <net-diag-measurement-header :detail="detail" />
        <v-alert v-if="rawNotice" :type="detail.rawExpired ? 'warning' : 'info'" variant="tonal" density="compact" class="mb-4">{{ rawNotice }}</v-alert>

        <h3 class="text-subtitle-1 font-weight-bold mb-2">Flo ping at the start of the window</h3>
        <net-diag-snapshot-table :rows="detail.floSnapshot ?? []" class="mb-6" />

        <h3 class="text-subtitle-1 font-weight-bold mb-2">Targets</h3>
        <net-diag-target-card
          v-for="target in detail.targets ?? []"
          :key="target.targetKey"
          :target="target"
          :ip-info="detail.ipInfo ?? {}"
          :show-series="showSeries"
          class="mb-4"
        />
      </template>
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from "vue";
import { mdiArrowLeft, mdiChartLine } from "@mdi/js";
import { EAdminRouteName } from "@/router/types";
import { useNetDiagMeasurementsStore } from "@/store/admin/networkDiagnostics/measurementsStore";
import { rawSamplesNotice } from "./measurementView";
import NetDiagMeasurementHeader from "./NetDiagMeasurementHeader.vue";
import NetDiagSnapshotTable from "./NetDiagSnapshotTable.vue";
import NetDiagTargetCard from "./NetDiagTargetCard.vue";

const props = defineProps<{ measurementId: string }>();
const store = useNetDiagMeasurementsStore();

// The store may still hold another measurement while this one loads; never show it.
const detail = computed(() => (store.detail?.measurementId === props.measurementId ? store.detail : null));
const showSeries = computed(() => store.detailRaw && detail.value !== null && detail.value.rawExpired !== true);
// rawExpired only arrives with raw=true (A4), so the notice appears after "Load RTT time-series".
const rawNotice = computed(() => (detail.value ? rawSamplesNotice(detail.value, store.detailRaw) : null));

function load(): void {
  store.loadMeasurement(props.measurementId, false);
}

function loadRaw(): void {
  store.loadMeasurement(props.measurementId, true);
}

watch(() => props.measurementId, load, { immediate: true });
</script>
