<template>
  <v-card variant="outlined">
    <v-card-title class="text-subtitle-1 d-flex flex-wrap align-center ga-2">
      <span>{{ title }}</span>
      <code v-if="target.targetKey" class="text-caption">{{ target.targetKey }}</code>
    </v-card-title>
    <v-card-text>
      <net-diag-rtt-chart v-if="showSeries && series.length > 0" :series="series" :description="chartDescription" class="mb-4" />
      <p v-else-if="showSeries" class="text-caption text-medium-emphasis mb-4">No time-series for this target: only TCP ping, flo UDP ping and the final hop of ICMP/TCP MTR record one.</p>
      <v-row>
        <v-col v-for="(path, pathIndex) in paths" :key="pathIndex" cols="12" :xl="paths.length > 1 ? 6 : 12">
          <h4 class="text-subtitle-2">
            {{ pathLabel(path.path) }}<span v-if="path.routeLabel" class="text-medium-emphasis"> — {{ path.routeLabel }}</span>
          </h4>
          <div class="text-caption text-medium-emphasis mb-2">{{ endpointsLine(path.endpoints) }}</div>
          <div v-for="(probe, probeIndex) in path.probes ?? []" :key="probeIndex" class="mb-4">
            <div class="d-flex align-center flex-wrap ga-2 mb-1">
              <strong class="text-body-2">{{ methodLabel(probe.method) }}</strong>
              <v-chip size="x-small" variant="tonal" :color="outcomeColor(probe.outcome)">{{ outcomeText(probe.outcome) }}</v-chip>
              <span v-if="probe.reason" class="text-caption text-medium-emphasis">{{ probe.reason }}</span>
            </div>
            <div v-if="hasProbeStats(probe)" class="text-caption mb-1">{{ probeStatsLine(probe) }}</div>
            <template v-if="probe.hops && probe.hops.length > 0">
              <p v-for="note in mtrNotes(probe.method)" :key="note" class="text-caption text-medium-emphasis mb-1">{{ note }}</p>
              <mtr-hop-table :hops="hopRows(probe.hops)" :hop-info="hopEnrichment(probe.hops, ipInfo)" />
            </template>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import MtrHopTable from "@/components/admin/MtrHopTable.vue";
import { OKABE_ITO_COLORS } from "@/helpers/lag-report-colors";
import type { IpInfoDto, TargetResultDto } from "@/store/admin/networkDiagnostics/types";
import { endpointsLine, hasProbeStats, hopEnrichment, hopRows, methodLabel, mtrNotes, orderedPaths, outcomeColor, outcomeText, pathLabel, probeStatsLine, rttSeries, targetTitle } from "./measurementView";
import NetDiagRttChart from "./NetDiagRttChart.vue";

const props = defineProps<{ target: TargetResultDto; ipInfo: Record<string, IpInfoDto | null>; showSeries: boolean }>();

const title = computed(() => targetTitle(props.target));
const paths = computed(() => orderedPaths(props.target));
const series = computed(() => rttSeries(props.target, OKABE_ITO_COLORS));
const chartDescription = computed(() => `Round-trip time over the measurement window for ${title.value}, one line per path and method (MTR lines are the final hop).`);
</script>
