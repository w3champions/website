<template>
  <v-table density="compact">
    <thead>
      <tr>
        <th>#</th>
        <th>Host</th>
        <th class="text-center">Avg</th>
        <th class="text-center">Min</th>
        <th class="text-center">Max</th>
        <th class="text-center">Loss</th>
        <th v-if="baselineHops.length" class="text-center">&Delta;</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(hop, i) in hops"
        :key="i"
        :class="isDegraded(hop, i) ? 'text-error' : ''"
        :style="isDegraded(hop, i) ? 'background: rgba(255,82,82,0.08)' : ''"
      >
        <td>{{ hop.hopNumber }}</td>
        <td class="text-caption">{{ hop.host ?? '*' }}</td>
        <td class="text-center">{{ hop.avgRttMs != null ? Math.round(hop.avgRttMs) + 'ms' : '*' }}</td>
        <td class="text-center">{{ hop.minRttMs != null ? Math.round(hop.minRttMs) + 'ms' : '*' }}</td>
        <td class="text-center">{{ hop.maxRttMs != null ? Math.round(hop.maxRttMs) + 'ms' : '*' }}</td>
        <td class="text-center" :class="hop.lossPercent > 0 ? 'text-warning' : ''">
          {{ hop.lossPercent.toFixed(1) }}%
        </td>
        <td v-if="baselineHops.length" class="text-center" :class="deltaClass(hop, i)">
          {{ deltaText(hop, i) }}
        </td>
      </tr>
      <tr v-if="!hops.length">
        <td :colspan="baselineHops.length ? 7 : 6" class="text-center text-medium-emphasis">
          No hops data
        </td>
      </tr>
    </tbody>
  </v-table>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { HopData } from "@/store/admin/lagReports/types";

export default defineComponent({
  name: "MtrHopTable",
  props: {
    hops: {
      type: Array as PropType<HopData[]>,
      required: true,
    },
    baselineHops: {
      type: Array as PropType<HopData[]>,
      default: () => [],
    },
  },
  setup(props) {
    function getBaselineHop(index: number): HopData | null {
      return props.baselineHops[index] ?? null;
    }

    function getDelta(hop: HopData, index: number): number | null {
      const baseline = getBaselineHop(index);
      if (!baseline || hop.avgRttMs == null || baseline.avgRttMs == null) return null;
      return Math.round(hop.avgRttMs - baseline.avgRttMs);
    }

    function isDegraded(hop: HopData, index: number): boolean {
      const delta = getDelta(hop, index);
      return (delta != null && delta > 20) || hop.lossPercent > 5;
    }

    function deltaText(hop: HopData, index: number): string {
      const delta = getDelta(hop, index);
      if (delta == null) return "—";
      if (delta === 0) return "—";
      return (delta > 0 ? "+" : "") + delta;
    }

    function deltaClass(hop: HopData, index: number): string {
      const delta = getDelta(hop, index);
      if (delta == null || delta === 0) return "text-medium-emphasis";
      if (delta > 20) return "text-error font-weight-bold";
      if (delta > 5) return "text-warning";
      return "text-medium-emphasis";
    }

    return {
      isDegraded,
      deltaText,
      deltaClass,
    };
  },
});
</script>
