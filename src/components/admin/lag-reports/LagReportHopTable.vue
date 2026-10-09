<template>
  <v-table density="compact" class="hop-table">
    <caption class="text-caption text-medium-emphasis text-left pa-1">
      {{ caption }}
    </caption>
    <thead>
      <tr>
        <th scope="col">Leg</th>
        <th scope="col">Measured at</th>
        <th scope="col" class="text-end">srtt p50</th>
        <th scope="col" class="text-end">srtt max</th>
        <th scope="col" class="text-end">rttvar max</th>
        <th scope="col" class="text-end">Retransmits</th>
        <th scope="col" class="text-end">Lost max</th>
        <th scope="col" class="text-end">Stall s</th>
        <th scope="col">HAProxy close</th>
        <th scope="col">Status</th>
      </tr>
    </thead>
    <tbody v-for="(leg, i) in legs" :key="i" :class="rowClass(leg, i)">
      <tr v-for="(end, ei) in rowsOf(leg)" :key="ei">
        <th v-if="ei === 0" scope="rowgroup" :rowspan="rowsOf(leg).length" class="hop-table__leg">
          <span v-if="showConnection" class="text-caption text-medium-emphasis d-block">Connection {{ leg.connectionIndex + 1 }}</span>
          {{ leg.label }}
          <v-chip v-if="i === worstIndex" color="error" size="x-small" variant="flat" class="ml-1">Worst leg</v-chip>
        </th>
        <template v-if="end">
          <td>{{ endLocation(leg, end) }}</td>
          <td class="text-end">{{ ms(end.stats.srttP50Ms) }}</td>
          <td class="text-end">{{ ms(end.stats.srttMaxMs) }}</td>
          <td class="text-end">{{ ms(end.stats.rttvarMaxMs) }}</td>
          <td class="text-end">{{ num(end.stats.retransTotal) }}</td>
          <td class="text-end">{{ num(end.stats.lostMax) }}</td>
          <td class="text-end">{{ num(end.stats.stallSecsTotal) }}</td>
        </template>
        <td v-else colspan="7" class="font-italic">{{ leg.statusText }}</td>
        <template v-if="ei === 0">
          <td :rowspan="rowsOf(leg).length">{{ closeText(leg) }}</td>
          <td :rowspan="rowsOf(leg).length">{{ leg.measurable ? leg.statusText : statusCode(leg) }}</td>
        </template>
      </tr>
    </tbody>
  </v-table>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from "vue";
import { describeWorstLeg, displayedEnds, type LegEndSummary, type LegSummary, roleText, WORST_LEG_MIN_JUMP_MS } from "./relayLegs";

export default defineComponent({
  name: "LagReportHopTable",
  props: {
    legs: { type: Array as PropType<LegSummary[]>, required: true },
    worstIndex: { type: Number as PropType<number | null>, default: null },
    playerName: { type: String, required: true },
  },
  setup(props) {
    const showConnection = computed(() => props.legs.some((l) => l.connectionIndex > 0));

    const caption = computed(() => {
      const worst = props.worstIndex != null ? props.legs[props.worstIndex] : null;
      let verdict = "No leg was measured.";
      if (worst) verdict = `Worst leg: ${describeWorstLeg(worst)} (ranked by stall seconds, then retransmits, then srtt jump).`;
      else if (props.legs.some((l) => l.measurable)) {
        verdict = `No leg stood out: no stalls, no retransmits, and no srtt jump of ${WORST_LEG_MIN_JUMP_MS} ms or more.`;
      }
      return `TCP legs of ${props.playerName}'s game connection. ${verdict}`;
    });

    // An unmeasured leg still gets a row for its reason, after any end the client measured itself.
    function rowsOf(leg: LegSummary): (LegEndSummary | null)[] {
      const ends = displayedEnds(leg);
      return leg.measurable ? (ends.length ? ends : [null]) : [...ends, null];
    }

    function rowClass(leg: LegSummary, i: number): string {
      if (i === props.worstIndex) return "hop-table__worst";
      return leg.measurable && leg.status !== "pending_close" ? "" : "text-medium-emphasis";
    }

    function endLocation(leg: LegSummary, end: LegEndSummary): string {
      return `${end.end === "near" ? leg.fromLabel : leg.toLabel} (${roleText(end.role)}, ${end.kind.toUpperCase()})`;
    }

    function ms(v: number | null): string {
      return v == null ? "—" : `${v} ms`;
    }

    function num(v: number | null): string {
      return v == null ? "—" : String(v);
    }

    function closeText(leg: LegSummary): string {
      const c = leg.close;
      if (!c) return "—";
      return `fc ${c.fcRttMs} ms / bc ${c.bcRttMs} ms, term ${c.term || "—"}`;
    }

    // The plain-words reason already fills the row; the column keeps the raw code for searching logs.
    function statusCode(leg: LegSummary): string {
      return leg.status;
    }

    return { showConnection, caption, rowsOf, rowClass, endLocation, ms, num, closeText, statusCode };
  },
});
</script>

<style scoped>
.hop-table caption {
  caption-side: top;
}

.hop-table__leg {
  vertical-align: top;
  white-space: nowrap;
}

.hop-table__worst {
  background: rgba(var(--v-theme-error), 0.1);
}

.hop-table__worst .hop-table__leg {
  border-left: 3px solid rgb(var(--v-theme-error));
}
</style>
