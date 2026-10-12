<template>
  <v-table density="compact">
    <thead>
      <tr>
        <th>#</th>
        <th>Host</th>
        <template v-if="hasInfo">
          <th>ASN</th>
          <th>Network</th>
          <th>Location</th>
        </template>
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
        <template v-if="hasInfo">
          <td class="text-caption">{{ asnLabel(i) }}</td>
          <td class="text-caption">{{ hopInfo[i]?.asnOrg ?? '—' }}</td>
          <td class="text-caption">{{ locationLabel(i) }}</td>
        </template>
        <td class="text-center">{{ hop.avgRttMs != null ? Math.round(hop.avgRttMs) + 'ms' : '*' }}</td>
        <td class="text-center">{{ hop.minRttMs != null ? Math.round(hop.minRttMs) + 'ms' : '*' }}</td>
        <td class="text-center">{{ hop.maxRttMs != null ? Math.round(hop.maxRttMs) + 'ms' : '*' }}</td>
        <td class="text-center" :class="hop.lossPercent != null && hop.lossPercent > 0 ? 'text-warning' : ''">
          {{ hop.lossPercent != null ? hop.lossPercent.toFixed(1) + '%' : '—' }}
        </td>
        <td v-if="baselineHops.length" class="text-center" :class="deltaClass(hop, i)">
          {{ deltaText(hop, i) }}
        </td>
      </tr>
      <tr v-if="!hops.length">
        <td :colspan="columnCount" class="text-center text-medium-emphasis">
          No hops data
        </td>
      </tr>
    </tbody>
  </v-table>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { HopEnrichment, MtrHopRow } from "@/store/admin/lagReports/types";

const BASE_COLUMNS = 6;
const INFO_COLUMNS = 3;

export default defineComponent({
  name: "MtrHopTable",
  props: {
    hops: {
      type: Array as PropType<MtrHopRow[]>,
      required: true,
    },
    baselineHops: {
      type: Array as PropType<MtrHopRow[]>,
      default: () => [],
    },
    /** GeoIP facts per hop, by index. Empty (the lag-report default) hides the ASN, network and location columns. */
    hopInfo: {
      type: Array as PropType<(HopEnrichment | null)[]>,
      default: () => [],
    },
  },
  setup(props) {
    const hasInfo = computed(() => props.hopInfo.length > 0);
    const columnCount = computed(() => BASE_COLUMNS + (hasInfo.value ? INFO_COLUMNS : 0) + (props.baselineHops.length ? 1 : 0));

    function getBaselineHop(index: number): MtrHopRow | null {
      return props.baselineHops[index] ?? null;
    }

    function getDelta(hop: MtrHopRow, index: number): number | null {
      const baseline = getBaselineHop(index);
      if (!baseline || hop.avgRttMs == null || baseline.avgRttMs == null) return null;
      return Math.round(hop.avgRttMs - baseline.avgRttMs);
    }

    function isDegraded(hop: MtrHopRow, index: number): boolean {
      const delta = getDelta(hop, index);
      return (delta != null && delta > 20) || (hop.lossPercent != null && hop.lossPercent > 5);
    }

    function deltaText(hop: MtrHopRow, index: number): string {
      const delta = getDelta(hop, index);
      if (delta == null) return "—";
      if (delta === 0) return "—";
      return (delta > 0 ? "+" : "") + delta;
    }

    function deltaClass(hop: MtrHopRow, index: number): string {
      const delta = getDelta(hop, index);
      if (delta == null || delta === 0) return "text-medium-emphasis";
      if (delta > 20) return "text-error font-weight-bold";
      if (delta > 5) return "text-warning";
      return "text-medium-emphasis";
    }

    function asnLabel(index: number): string {
      const asn = props.hopInfo[index]?.asn;
      return asn == null ? "—" : `AS${asn}`;
    }

    function locationLabel(index: number): string {
      const info = props.hopInfo[index];
      const parts = [info?.city, info?.country].filter((part): part is string => !!part);
      return parts.length ? parts.join(", ") : "—";
    }

    return {
      hasInfo,
      columnCount,
      isDegraded,
      deltaText,
      deltaClass,
      asnLabel,
      locationLabel,
    };
  },
});
</script>
