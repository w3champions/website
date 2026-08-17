<template>
  <template v-if="column === 'createdAt'">
    <div>{{ formatDate(report.createdAt) }}</div>
    <div class="text-caption text-medium-emphasis">{{ formatRelative(report.createdAt) }}</div>
  </template>
  <span v-else-if="column === 'mapPath'" :title="report.mapPath">{{ formatMapName(report.mapPath) }}</span>
  <template v-else-if="column === 'playerCount'">
    {{ report.players.length }}
    <span v-if="explicitCount(report) > 0" class="text-caption text-medium-emphasis">
      ({{ explicitCount(report) }} subm.)
    </span>
  </template>
  <span v-else-if="column === 'proxiedCount'" :class="{ 'text-medium-emphasis': proxiedCount(report) === 0 }">
    {{ proxiedCount(report) === 0 ? "—" : proxiedCount(report) }}
  </span>
  <span v-else-if="column === 'lagEvents'" :class="{ 'text-medium-emphasis': sumLagEvents(report) === 0 }">
    {{ sumLagEvents(report) === 0 ? "—" : sumLagEvents(report) }}
  </span>
  <span v-else-if="column === 'connectionEvents'" :class="{ 'text-medium-emphasis': sumConnectionEvents(report) === 0 }">
    {{ sumConnectionEvents(report) === 0 ? "—" : sumConnectionEvents(report) }}
  </span>
  <span
    v-else-if="column === 'serverNodeName'"
    class="clickable"
    :title="`Filter by ${report.serverNodeName}`"
    @click.stop="$emit('filter-server-node', report.serverNodeId, report.serverNodeName)"
  >
    {{ report.serverNodeName }}
  </span>
  <v-icon v-else-if="column === 'hasExplicitReport'" :color="report.hasExplicitReport ? 'success' : 'grey'" size="small">
    {{ report.hasExplicitReport ? mdiCheckCircle : mdiCloseCircle }}
  </v-icon>
  <template v-else-if="column === 'submittedBy'">
    <template v-if="explicitCount(report) > 0">
      <span
        v-for="(p, i) in report.players.filter((pl) => pl.isExplicit)"
        :key="i"
        class="text-body-2 clickable me-2"
        :title="`Filter by ${p.battleTag}`"
        @click.stop="$emit('filter-player', p.battleTag)"
      >
        {{ p.battleTag }}
      </span>
    </template>
    <span v-else class="text-medium-emphasis">—</span>
  </template>
  <template v-else-if="column === 'players'">
    <div v-for="(p, i) in report.players" :key="i" class="d-flex align-center ga-1 my-1 flex-wrap">
      <span
        class="text-body-2 clickable"
        :title="`Filter by ${p.battleTag}`"
        @click.stop="$emit('filter-player', p.battleTag)"
      >
        {{ p.battleTag }}
      </span>
      <v-chip v-if="p.isExplicit" size="x-small" color="warning" variant="tonal">submitted</v-chip>
      <v-chip
        v-if="p.connectionType === 'Proxied'"
        size="x-small"
        color="info"
        variant="tonal"
        :class="{ clickable: !!p.proxyName }"
        :title="p.proxyName ? `Filter by proxy ${p.proxyName}` : undefined"
        @click.stop="p.proxyName && $emit('filter-proxy', p.proxyName)"
      >
        proxied{{ p.proxyName ? `: ${p.proxyName}` : "" }}
      </v-chip>
      <v-chip
        v-for="(cat, ci) in p.issueCategories.slice(0, 3)"
        :key="ci"
        size="x-small"
        color="error"
        variant="tonal"
      >
        {{ cat }}
      </v-chip>
      <v-chip
        v-if="p.issueCategories.length > 3"
        size="x-small"
        variant="tonal"
        :title="p.issueCategories.slice(3).join(', ')"
      >
        +{{ p.issueCategories.length - 3 }}
      </v-chip>
      <v-chip
        v-for="(tag, ti) in p.connection_issue_tags ?? []"
        :key="'tag-' + ti"
        size="x-small"
        color="deep-purple"
        variant="tonal"
        class="clickable"
        :title="`Launcher verdict: ${tag} — click to filter`"
        @click.stop="$emit('filter-tag', tag)"
      >
        {{ tag }}
      </v-chip>
    </div>
  </template>
  <v-btn
    v-else-if="column === 'actions'"
    size="small"
    variant="text"
    color="primary"
    :prepend-icon="mdiEye"
    @click.stop="$emit('open')"
  >
    Detail
  </v-btn>
  <template v-else>{{ cellText(report, column) }}</template>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { mdiCheckCircle, mdiCloseCircle, mdiEye } from "@mdi/js";
import { formatDistanceToNow } from "date-fns";
import { EConnectionType, LagReportListItem } from "@/store/admin/lagReports/types";

// One cell of a lag-report row, keyed by column — the single place a column's
// rendering lives, rendered by the flat table's slots. Click-to-filter targets
// emit and stop propagation, so a cell click filters rather than opening the
// report.
export default defineComponent({
  name: "LagReportRowCells",
  props: {
    report: {
      type: Object as PropType<LagReportListItem>,
      required: true,
    },
    column: {
      type: String,
      required: true,
    },
  },
  emits: ["open", "filter-player", "filter-server-node", "filter-proxy", "filter-tag"],
  setup() {
    /** "maps\W3Champions\5335_Direct Strike 6.5.8_w3c.w3x" → "Direct Strike 6.5.8" */
    function formatMapName(mapPath: string): string {
      if (!mapPath) return "";
      const base = mapPath.split(/[\\/]/).pop() ?? "";
      return base
        .replace(/\.(w3x|w3m)$/i, "")
        .replace(/^\d+_/, "")
        .replace(/_w3c$/i, "");
    }

    function explicitCount(item: LagReportListItem): number {
      return item.players.filter((p) => p.isExplicit).length;
    }

    function proxiedCount(item: LagReportListItem): number {
      return item.players.filter((p) => p.connectionType === EConnectionType.Proxied).length;
    }

    function sumLagEvents(item: LagReportListItem): number {
      return item.players.reduce((sum, p) => sum + (p.lagEventCount ?? 0), 0);
    }

    function sumConnectionEvents(item: LagReportListItem): number {
      return item.players.reduce((sum, p) => sum + (p.connectionEventCount ?? 0), 0);
    }

    function formatDate(iso: string): string {
      if (!iso) return "";
      const d = new Date(iso);
      return d.toLocaleString();
    }

    function formatRelative(iso: string): string {
      if (!iso) return "";
      return formatDistanceToNow(new Date(iso), { addSuffix: true });
    }

    // The columns that are plain text in every variant.
    function cellText(report: LagReportListItem, key: string): string {
      switch (key) {
        case "gameName":
          return report.gameName;
        case "floGameId":
          return String(report.floGameId);
        case "gameId":
          return String(report.gameId);
        case "serverNodeId":
          return String(report.serverNodeId);
        default:
          return "";
      }
    }

    return {
      formatMapName,
      explicitCount,
      proxiedCount,
      sumLagEvents,
      sumConnectionEvents,
      formatDate,
      formatRelative,
      cellText,
      mdiCheckCircle,
      mdiCloseCircle,
      mdiEye,
    };
  },
});
</script>

<style lang="scss" scoped>
.clickable {
  cursor: pointer;
}

.clickable:hover {
  text-decoration: underline;
}
</style>
