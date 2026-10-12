<template>
  <section aria-labelledby="netdiag-fleet">
    <h3 id="netdiag-fleet" class="text-subtitle-1 font-weight-bold mb-2">Fleet view</h3>
    <v-row dense align="center">
      <v-col cols="12" md="4" lg="3">
        <v-select v-model="targetKey" :items="targetItems" label="Target" variant="underlined" color="primary" hide-details />
      </v-col>
      <v-col cols="6" md="2">
        <v-select v-model="path" :items="paths" label="Path" variant="underlined" color="primary" hide-details />
      </v-col>
      <v-col cols="6" md="4" lg="3">
        <v-select v-model="method" :items="methods" label="Method" variant="underlined" color="primary" hide-details />
      </v-col>
      <v-col cols="6" md="2">
        <v-select v-model="groupBy" :items="FLEET_GROUP_BY_ITEMS" label="Group by" variant="underlined" color="primary" hide-details />
      </v-col>
      <v-col cols="6" md="12" lg="2">
        <v-btn-toggle v-model="metric" mandatory density="compact" color="primary" variant="outlined" aria-label="Colour dots by">
          <v-btn value="p50">p50</v-btn>
          <v-btn value="loss">Loss</v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>

    <v-alert v-if="mapErrorText" type="error" variant="tonal" density="compact" class="my-2">Map: {{ mapErrorText }}</v-alert>
    <v-alert v-if="tableErrorText" type="error" variant="tonal" density="compact" class="my-2">Table: {{ tableErrorText }}</v-alert>
    <v-progress-linear v-if="busy" indeterminate color="primary" class="my-2" />

    <p v-if="floNodesHint" class="text-caption text-warning mt-2">{{ floNodesHint }}</p>
    <p v-if="emptyStateText" class="text-body-2 text-medium-emphasis mt-4">{{ emptyStateText }}</p>
    <template v-else>
      <v-row class="mt-2">
        <v-col cols="12" lg="6">
          <net-diag-map :points="points" :colors="bucketColors" :fit-key="mapFitKey" :description="mapDescription" />
          <div class="d-flex flex-wrap ga-3 mt-2 text-caption">
            <span v-for="bucket in COLOR_BUCKETS" :key="bucket" class="d-inline-flex align-center ga-1">
              <span class="netdiag-legend-dot" :style="{ backgroundColor: bucketColors[bucket] }"></span>
              {{ legend[bucket] }}
            </span>
          </div>
          <p v-if="mapNoticeText" class="text-caption text-warning mt-1">{{ mapNoticeText }}</p>
          <p v-if="mapLagText" class="text-caption text-info mt-1">{{ mapLagText }}</p>
        </v-col>
        <v-col cols="12" lg="6">
          <net-diag-aggregate-chart v-if="bars && bars.labels.length > 0" :bars="bars" :description="chartDescription" />
          <p v-else-if="aggregateEmpty" class="text-caption text-medium-emphasis">No submitted results for this selection yet.</p>
          <p v-if="chartNoticeText" class="text-caption text-medium-emphasis mt-1">{{ chartNoticeText }}</p>
        </v-col>
      </v-row>

      <p v-if="aggregateTruncated" class="text-caption text-warning mt-4 mb-0">{{ AGGREGATE_TRUNCATED_NOTICE }}</p>
      <v-data-table
        :headers="aggregateHeaders"
        :items="tableRows"
        :items-per-page="25"
        :loading="aggregateBusy"
        density="compact"
        :class="aggregateTruncated ? 'mt-1' : 'mt-4'"
        :no-data-text="tableNoDataText"
      />
    </template>
  </section>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useTheme } from "vuetify";
import type { DataTableHeader } from "vuetify";
import { readThemeColor, THEME_FALLBACK_COLOR } from "@/helpers/lag-report-colors";
import { useNetDiagFleetStore } from "@/store/admin/networkDiagnostics/fleetStore";
import { fleetAggregateKey, fleetSelectionKey } from "@/store/admin/networkDiagnostics/fleetSelection";
import type { NetDiagMethod, NetDiagPath, RunDto, TargetsDto } from "@/store/admin/networkDiagnostics/types";
import { AGGREGATE_TRUNCATED_NOTICE, aggregateBars, aggregateMeasurementCount, aggregateTableRows, BUCKET_THEME_COLOR, bucketLegend, chartNotice, COLOR_BUCKETS, type ColorBucket, FLEET_GROUP_BY_ITEMS, fleetEmptyState, fleetLoadPlan, floNodesMissing, type FleetGroupBy, type FleetLoadInputs, type FleetSelection, locatedCount, mapLagNotice, type MapMetric, mapNotice, mapPoints, methodItems, pathItems, runTargetItems } from "./fleet";
import { METHOD_LABELS } from "./format";
import NetDiagAggregateChart from "./NetDiagAggregateChart.vue";
import NetDiagMap from "./NetDiagMap.vue";

// The parent keys this component by run id, so every selector starts fresh for another run.
const props = defineProps<{ run: RunDto; targets: TargetsDto | null; targetsLoading: boolean }>();
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

const selectionKey = computed(() => (selection.value === null ? "" : fleetSelectionKey(selection.value)));

// A refresh of the page hands over a new `run`: reload, but keep the held data and the map view while the same selection reloads.
let lastInputs: FleetLoadInputs | undefined;
watch([selectionKey, groupBy, () => props.run] as const, ([key, group, run]) => {
  const current = selection.value;
  if (current === null) return;
  const inputs: FleetLoadInputs = { selectionKey: key, groupBy: group, run };
  const plan = fleetLoadPlan(inputs, lastInputs);
  lastInputs = inputs;
  if (plan.observations) void fleet.loadObservations(current);
  if (plan.aggregate) void fleet.loadAggregate(current, group);
}, { immediate: true });

// The shared store outlives this view: drop its (up to 20 000) observations when the view goes.
onBeforeUnmount(() => fleet.clear());

// The store is shared and survives navigation: show its data only while it belongs to this selection.
const observationsCurrent = computed(() => selection.value !== null && fleet.observationsKey === selectionKey.value);
const aggregateCurrent = computed(() => selection.value !== null && fleet.aggregateKey === fleetAggregateKey(selection.value, groupBy.value));
const shownObservations = computed(() => (observationsCurrent.value ? fleet.observations : []));
const shownAggregate = computed(() => (aggregateCurrent.value ? fleet.aggregate : null));
// The two loads fail independently: each names its part, so a filled table beside an empty map explains itself.
const mapErrorText = computed(() => (observationsCurrent.value ? fleet.observationsError : ""));
const tableErrorText = computed(() => (aggregateCurrent.value ? fleet.aggregateError : ""));
const aggregateBusy = computed(() => aggregateCurrent.value && fleet.aggregateLoading);
const observationsBusy = computed(() => observationsCurrent.value && fleet.observationsLoading);
const busy = computed(() => aggregateBusy.value || observationsBusy.value);
const aggregateTruncated = computed(() => aggregateCurrent.value && fleet.aggregateTruncated);
const aggregateEmpty = computed(() => shownAggregate.value !== null && shownAggregate.value.rows.length === 0);
const mapFitKey = computed(() => (observationsCurrent.value ? selectionKey.value : ""));

const emptyState = computed(() => fleetEmptyState(props.run, props.targets, props.targetsLoading, targetItems.value.length));
const EMPTY_STATE_TEXT = {
  "targets-loading": "Loading the target list…",
  "targets-unavailable": "The target list is not available, so this run's flo nodes cannot be named. Press Refresh to try again.",
  "no-targets": "This run has no target to show.",
} as const;
const FLO_NODES_HINT_TEXT = {
  loading: "Loading the flo node list…",
  failed: "The flo node list could not be loaded, so this run's flo nodes are missing from the targets. Press Refresh to try again.",
} as const;
const floNodesHint = computed(() => {
  if (emptyState.value !== null || !floNodesMissing(props.run, props.targets)) return "";
  return props.targetsLoading ? FLO_NODES_HINT_TEXT.loading : FLO_NODES_HINT_TEXT.failed;
});
const tableNoDataText = computed(() => {
  if (aggregateBusy.value) return "Loading…";
  return aggregateCurrent.value && fleet.aggregateError ? "The aggregate could not be loaded." : "No submitted results for this selection yet.";
});
const emptyStateText = computed(() => (emptyState.value === null ? "" : EMPTY_STATE_TEXT[emptyState.value]));

function themeColor(bucket: ColorBucket): string {
  return readThemeColor(BUCKET_THEME_COLOR[bucket]) ?? THEME_FALLBACK_COLOR;
}

const bucketColors = computed<Record<ColorBucket, string>>(() => {
  // readThemeColor reads CSS variables, which Vue cannot track; this re-reads them on a theme switch.
  void theme.global.name.value;
  return { good: themeColor("good"), fair: themeColor("fair"), bad: themeColor("bad"), unknown: themeColor("unknown") };
});

const points = computed(() => mapPoints(shownObservations.value, metric.value));
// A dot can stand for several measurements at the same coordinates: the texts count measurements, not dots.
const drawnCount = computed(() => locatedCount(points.value));
const observationsTruncated = computed(() => observationsCurrent.value && fleet.observationsTruncated);
const mapNoticeText = computed(() =>
  mapNotice({
    shown: drawnCount.value,
    withoutLocation: shownObservations.value.length - drawnCount.value,
    truncated: observationsTruncated.value,
  })
);
const mapLagText = computed(() =>
  mapLagNotice({
    aggregateCount: shownAggregate.value === null ? null : aggregateMeasurementCount(shownAggregate.value),
    loadedObservations: shownObservations.value.length,
    observationsTruncated: observationsTruncated.value,
    settled: observationsCurrent.value && aggregateCurrent.value && !busy.value && mapErrorText.value === "" && tableErrorText.value === "",
  })
);
const chartNoticeText = computed(() => (shownAggregate.value ? chartNotice(shownAggregate.value.rows.length) : null));
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

const mapDescription = computed(() => `Map of ${drawnCount.value} measurements of ${METHOD_LABELS[method.value]} to ${targetTitle.value} (${path.value}), coloured by ${metric.value === "p50" ? "median round-trip time" : "loss"}.`);
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
