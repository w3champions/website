<template>
  <v-card variant="outlined" class="mb-4">
    <v-card-title class="text-subtitle-2 py-2">Connection Topology</v-card-title>
    <v-card-text>
      <div v-for="(player, pi) in players" :key="'topo-' + pi" class="mb-3 pa-3 rounded" style="border-left: 3px solid;" :style="{ borderColor: playerColors[pi] }">
        <div class="d-flex align-center ga-2 mb-2">
          <v-icon :color="playerColors[pi]" size="x-small">{{ mdiCircle }}</v-icon>
          <strong :style="{ color: playerColors[pi] }">{{ player.battleTag }}</strong>
          <v-chip v-if="player.isExplicit" size="x-small" color="warning" variant="flat">reported -lag</v-chip>
          <v-chip v-else size="x-small" variant="outlined" color="grey">auto-measured</v-chip>
        </div>
        <div class="d-flex align-center ga-1 flex-wrap text-caption">
          <template v-for="(segment, si) in playerTopology(player)" :key="'seg-' + pi + '-' + si">
            <!-- Node -->
            <v-sheet
              v-if="segment.type === 'node'"
              rounded
              border
              class="pa-2 text-center"
              min-width="80"
              :style="{ borderColor: segment.borderColor + ' !important' }"
            >
              <div :style="{ color: segment.labelColor }" class="font-weight-bold">{{ segment.label }}</div>
              <div class="text-medium-emphasis" style="font-size: 10px;">{{ segment.role }}</div>
              <div v-if="segment.subtitle" class="text-medium-emphasis" style="font-size: 9px;">{{ segment.subtitle }}</div>
            </v-sheet>
            <!-- Arrow -->
            <div v-else-if="segment.type === 'arrow'" class="text-center px-1">
              <template v-for="(line, li) in segment.lines" :key="'line-' + li">
                <div :class="line.class" style="font-size: 9px;">{{ line.label }}</div>
                <div :class="line.class">{{ line.arrow }}</div>
              </template>
            </div>
          </template>
        </div>
        <!-- Coverage summary -->
        <div class="text-caption text-medium-emphasis mt-1" style="font-size: 10px;">
          <div v-for="(note, ni) in topologyCoverageNotes(player)" :key="'note-' + pi + '-' + ni">
            {{ note }}
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { EConnectionType, LagReportPlayer } from "@/store/admin/lagReports/types";
import { mdiCircle } from "@mdi/js";

const PLAYER_COLORS = ["#ef5350", "#42a5f5", "#66bb6a", "#ffb74d", "#ab47bc", "#26c6da", "#ec407a", "#8d6e63"];

type TopoSegment =
  | { type: "node"; label: string; role: string; subtitle?: string; borderColor: string; labelColor: string }
  | { type: "arrow"; lines: { label: string; arrow: string; class: string }[] };

export default defineComponent({
  name: "LagReportTopology",
  props: {
    players: { type: Array as PropType<LagReportPlayer[]>, required: true },
    playerColors: { type: Array as PropType<string[]>, required: true },
    serverNodeName: { type: String, required: true },
  },
  setup(props) {
    function playerName(battleTag: string): string {
      return battleTag.split("#")[0];
    }

    function isProxied(player: LagReportPlayer): boolean {
      return player.connectionType === EConnectionType.Proxied;
    }

    function playerTopology(player: LagReportPlayer): TopoSegment[] {
      const hasFwd = player.diagnostics.targetMtr.length > 0;
      const hasRev = player.diagnostics.reverseMtr.length > 0;
      const proxied = isProxied(player) && player.proxyName;
      const pi = props.players.indexOf(player);
      const color = PLAYER_COLORS[pi >= 0 ? pi % PLAYER_COLORS.length : 0];

      const segments: TopoSegment[] = [];

      segments.push({
        type: "node",
        label: playerName(player.battleTag),
        role: "client",
        subtitle: player.clientIp ?? undefined,
        borderColor: "",
        labelColor: color,
      });

      if (proxied) {
        const lines: { label: string; arrow: string; class: string }[] = [];
        if (hasFwd) lines.push({ label: "client MTR", arrow: "→→→", class: "text-info" });
        lines.push({ label: "client ping (e2e)", arrow: "· · ·→", class: "text-medium-emphasis" });
        lines.push({ label: "server ping (e2e)", arrow: "←· · ·", class: "text-medium-emphasis" });
        segments.push({ type: "arrow", lines });

        segments.push({
          type: "node",
          label: player.proxyName!,
          role: "proxy",
          subtitle: player.proxyIp ? `${player.proxyIp}${player.proxyPort ? ":" + player.proxyPort : ""}` : undefined,
          borderColor: "orange",
          labelColor: "orange",
        });

        const lines2: { label: string; arrow: string; class: string }[] = [];
        lines2.push({ label: "client ping (e2e)", arrow: "· · ·→", class: "text-medium-emphasis" });
        lines2.push({ label: "server ping (e2e)", arrow: "←· · ·", class: "text-medium-emphasis" });
        if (hasRev) lines2.push({ label: "reverse MTR", arrow: "←←←", class: "text-success" });
        segments.push({ type: "arrow", lines: lines2 });
      } else {
        const lines: { label: string; arrow: string; class: string }[] = [];
        if (hasFwd) lines.push({ label: "client MTR", arrow: "→→→", class: "text-info" });
        lines.push({ label: "client ping (e2e)", arrow: "· · ·→", class: "text-medium-emphasis" });
        lines.push({ label: "server ping (e2e)", arrow: "←· · ·", class: "text-medium-emphasis" });
        if (hasRev) lines.push({ label: "reverse MTR", arrow: "←←←", class: "text-success" });
        segments.push({ type: "arrow", lines });
      }

      segments.push({
        type: "node",
        label: props.serverNodeName,
        role: "game server",
        borderColor: "#4fc3f7",
        labelColor: "#4fc3f7",
      });

      return segments;
    }

    function topologyCoverageNotes(player: LagReportPlayer): string[] {
      const notes: string[] = [];
      const name = playerName(player.battleTag);
      const proxied = isProxied(player) && player.proxyName;
      const fwdTargets = [...new Set(player.diagnostics.targetMtr.map((t) => t.target))];
      const revTargets = [...new Set(player.diagnostics.reverseMtr.map((t) => t.target))];

      if (fwdTargets.length) {
        const dest = proxied ? player.proxyName ?? fwdTargets[0] : props.serverNodeName;
        notes.push(`▸ Client MTR covers: ${name} → ${dest} (${fwdTargets.join(", ")})`);
      }
      if (revTargets.length) {
        const dest = proxied ? player.proxyName ?? revTargets[0] : name;
        notes.push(`▸ Reverse MTR covers: ${props.serverNodeName} → ${dest} (${revTargets.join(", ")})`);
      }
      if (proxied) {
        notes.push(`⚠ No hop-level data through ${player.proxyName} — only e2e ping covers the full path`);
      }

      return notes;
    }

    return {
      playerTopology,
      topologyCoverageNotes,
      mdiCircle,
    };
  },
});
</script>
