<template>
  <section aria-labelledby="netdiag-fleet">
    <h3 id="netdiag-fleet" class="text-subtitle-1 font-weight-bold mb-2">Fleet view</h3>
    <v-row dense align="center">
      <v-col cols="12" md="4">
        <v-select v-model="targetKey" :items="targetItems" label="Target" variant="underlined" color="primary" hide-details />
      </v-col>
      <v-col cols="6" md="2">
        <v-select v-model="path" :items="paths" label="Path" variant="underlined" color="primary" hide-details />
      </v-col>
      <v-col cols="6" md="2">
        <v-select v-model="method" :items="methods" label="Method" variant="underlined" color="primary" hide-details />
      </v-col>
      <v-col cols="6" md="2">
        <v-select v-model="groupBy" :items="FLEET_GROUP_BY_ITEMS" label="Group by" variant="underlined" color="primary" hide-details />
      </v-col>
      <v-col cols="6" md="2">
        <v-btn-toggle v-model="metric" mandatory density="compact" color="primary" variant="outlined" aria-label="Colour dots by">
          <v-btn value="p50">p50</v-btn>
          <v-btn value="loss">Loss</v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>

    <v-alert v-if="errorText" type="error" variant="tonal" density="compact" class="my-2">{{ errorText }}</v-alert>
    <v-progress-linear v-if="fleet.aggregateLoading || fleet.observationsLoading" indeterminate color="primary" class="my-2" />

    <v-row class="mt-2">
      <v-col cols="12" lg="6">
        <net-diag-map :points="points" :colors="bucketColors" :description="mapDescription" />
        <div class="d-flex flex-wrap ga-3 mt-2 text-caption">
          <span v-for="bucket in COLOR_BUCKETS" :key="bucket" class="d-inline-flex align-center ga-1">
            <span class="netdiag-legend-dot" :style="{ backgroundColor: bucketColors[bucket] }"></span>
            {{ legend[bucket] }}
          </span>
        </div>
        <p v-if="observationsTruncated" class="text-caption text-warning mt-1">
          The map shows the first {{ shownObservations.length.toLocaleString() }} measurements only; there may be more.
        </p>
      </v-col>
      <v-col cols="12" lg="6">
        <net-diag-aggregate-chart v-if="bars && bars.labels.length > 0" :bars="bars" :description="chartDescription" />
        <p v-else-if="!fleet.aggregateLoading" class="text-caption text-medium-emphasis">No submitted results for this selection yet.</p>
      </v-col>
    </v-row>

    <v-data-table
      :headers="aggregateHeaders"
      :items="tableRows"
      :items-per-page="25"
      density="compact"
      class="mt-4"
      no-data-text="No submitted results for this selection yet."
    />
  </section>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useTheme } from "vuetify";
import type { DataTableHeader } from "vuetify";
import { readThemeColor, THEME_FALLBACK_COLOR } from "@/helpers/lag-report-colors";
import { useNetDiagFleetStore } from "@/store/admin/networkDiagnostics/fleetStore";
import { fleetSelectionKey } from "@/store/admin/networkDiagnostics/fleetSelection";
import type { NetDiagMethod, NetDiagPath, RunDto, TargetsDto } from "@/store/admin/networkDiagnostics/types";
import { aggregateBars, aggregateTableRows, BUCKET_THEME_COLOR, bucketLegend, COLOR_BUCKETS, type ColorBucket, FLEET_GROUP_BY_ITEMS, type FleetGroupBy, type FleetSelection, type MapMetric, mapPoints, methodItems, pathItems, runTargetItems } from "./fleet";
import { METHOD_LABELS } from "./format";
import NetDiagAggregateChart from "./NetDiagAggregateChart.vue";
import NetDiagMap from "./NetDiagMap.vue";

// The parent keys this component by run id, so every selector starts fresh for another run.
const props = defineProps<{ run: RunDto; targets: TargetsDto | null }>();
const fleet = useNetDiagFleetStore();
const theme = useTheme();

const targetKey = ref("");
const path = ref<NetDiagPath>("direct");
const method = ref<NetDiagMethod>(props.run.methods[0] ?? "IcmpMtr");
const groupBy = ref<FleetGroupBy>("country");
const metric = ref<MapMetric>("p50");

const targetItems = computed(() => runTargetItems(props.run, props.targets));
const paths = computed(() => pathItems(targetKey.value));
const methods = computed(() => methodItems(props.run.methods));

// Keep each selector on a value its options still contain.
watch(targetItems, (items) => {
  if (!items.some((item) => item.value === targetKey.value)) targetKey.value = items[0]?.value ?? "";
}, { immediate: true });
watch(paths, (options) => {
  if (!options.includes(path.value)) path.value = "direct";
});

const selection = computed<FleetSelection | null>(() => (targetKey.value === "" ? null : { runId: props.run.id, targetKey: targetKey.value, path: path.value, method: method.value }));

watch(selection, (current) => {
  if (current) fleet.loadObservations(current);
}, { immediate: true });
watch([selection, groupBy], ([current, group]) => {
  if (current) fleet.loadAggregate(current, group);
}, { immediate: true });

// The store is shared and survives navigation: show its data only while it belongs to this selection.
const observationsCurrent = computed(() => selection.value !== null && fleet.observationsKey === fleetSelectionKey(selection.value));
const aggregateCurrent = computed(() => selection.value !== null && fleet.aggregateKey === `${fleetSelectionKey(selection.value)}|${groupBy.value}`);
const shownObservations = computed(() => (observationsCurrent.value ? fleet.observations : []));
const observationsTruncated = computed(() => observationsCurrent.value && fleet.observationsTruncated);
const shownAggregate = computed(() => (aggregateCurrent.value ? fleet.aggregate : null));
const errorText = computed(() => (aggregateCurrent.value ? fleet.aggregateError : "") || (observationsCurrent.value ? fleet.observationsError : ""));

function themeColor(bucket: ColorBucket): string {
  return readThemeColor(BUCKET_THEME_COLOR[bucket]) ?? THEME_FALLBACK_COLOR;
}

const bucketColors = computed<Record<ColorBucket, string>>(() => {
  // readThemeColor reads CSS variables, which Vue cannot track; this re-reads them on a theme switch.
  void theme.global.name.value;
  return { good: themeColor("good"), fair: themeColor("fair"), bad: themeColor("bad"), unknown: themeColor("unknown") };
});

const points = computed(() => mapPoints(shownObservations.value, metric.value));
const legend = computed(() => bucketLegend(metric.value));
const bars = computed(() => (shownAggregate.value ? aggregateBars(shownAggregate.value) : null));
const tableRows = computed(() => (shownAggregate.value ? aggregateTableRows(shownAggregate.value) : []));
const groupTitle = computed(() => FLEET_GROUP_BY_ITEMS.find((item) => item.value === groupBy.value)?.title ?? groupBy.value);
const targetTitle = computed(() => targetItems.value.find((item) => item.value === targetKey.value)?.title ?? targetKey.value);

const aggregateHeaders = computed<DataTableHeader[]>(() => [
  { title: groupTitle.value, value: "label", sortable: true },
  { title: "Results", value: "count", sortable: true, align: "end" },
  { title: "Median p50", value: "p50Median", sortable: false, align: "end" },
  { title: "p90 of p50", value: "p50P90", sortable: false, align: "end" },
  { title: "Median loss", value: "lossMedian", sortable: false, align: "end" },
  { title: "Loss > 1%", value: "lossOver1", sortable: false, align: "end" },
  { title: "Unreachable", value: "unreachable", sortable: false, align: "end" },
]);

const mapDescription = computed(() => `Map of ${points.value.length} measurements of ${METHOD_LABELS[method.value]} to ${targetTitle.value} (${path.value}), coloured by ${metric.value === "p50" ? "median round-trip time" : "loss"}.`);
const chartDescription = computed(() => `Median p50 and p90 of p50 per ${groupTitle.value.toLowerCase()} for ${targetTitle.value}.`);
</script>

<style scoped>
.netdiag-legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
</style>
