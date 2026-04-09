<template>
  <div>
    <v-card-title class="pt-3 d-flex align-center">
      <v-btn variant="text" :prepend-icon="mdiArrowLeft" @click="goBack">Back</v-btn>
      <span class="ml-2">Lag Report Detail</span>
    </v-card-title>

    <v-container v-if="loading" class="d-flex justify-center pa-8">
      <v-progress-circular indeterminate color="primary" />
    </v-container>

    <v-container v-else-if="report" fluid class="pa-4">
      <!-- ====== GAME HEADER ====== -->
      <v-card variant="outlined" class="mb-4">
        <v-card-text class="py-3">
          <div class="d-flex flex-wrap ga-4 align-center mb-2">
            <div><span class="text-medium-emphasis">Map:</span> <strong>{{ report.mapPath }}</strong></div>
            <div><span class="text-medium-emphasis">Server:</span> <strong class="text-info">{{ report.serverNodeName }}</strong></div>
            <div><span class="text-medium-emphasis">Game:</span> <strong>{{ report.gameName }}</strong></div>
            <div><span class="text-medium-emphasis">Flo ID:</span> <strong>{{ report.floGameId }}</strong></div>
            <div><span class="text-medium-emphasis">Created:</span> <strong>{{ formatDate(report.createdAt) }}</strong></div>
            <div>
              <span class="text-medium-emphasis">Report ID:</span>
              <code class="text-caption ml-1">{{ report.id }}</code>
            </div>
          </div>
          <div class="d-flex flex-wrap ga-2 align-center">
            <span class="text-medium-emphasis text-caption">Events:</span>
            <template v-for="(player, pi) in report.players" :key="'ev-' + pi">
              <v-chip
                v-if="player.diagnostics.lagEvents.length"
                size="x-small"
                :color="playerColors[pi]"
                variant="flat"
              >
                {{ player.diagnostics.lagEvents.length }}x !lag ({{ playerName(player.battleTag) }})
              </v-chip>
              <v-chip
                v-for="(ce, ci) in player.diagnostics.connectionEvents"
                :key="'ce-' + pi + '-' + ci"
                size="x-small"
                :color="[EConnectionEventType.Reconnect, EConnectionEventType.GamePaused, EConnectionEventType.StartLag].includes(ce.eventType) ? 'warning' : [EConnectionEventType.GameResumed, EConnectionEventType.StopLag].includes(ce.eventType) ? 'info' : 'error'"
                variant="flat"
              >
                {{ connectionEventLabel(ce.eventType) }} {{ formatGameTime(ce.gameTimeOffsetMs) }} ({{ playerName(player.battleTag) }})
              </v-chip>
            </template>
            <span class="text-medium-emphasis text-caption ml-2">Categories:</span>
            <template v-for="(player, pi) in report.players" :key="'cat-' + pi">
              <v-chip
                v-for="(cat, ci) in player.issueCategories"
                :key="'ic-' + pi + '-' + ci"
                size="x-small"
                color="error"
                variant="tonal"
              >
                {{ cat }}
              </v-chip>
            </template>
          </div>
          <div v-for="(player, pi) in report.players" :key="'ft-' + pi">
            <div v-if="player.freeText" class="text-medium-emphasis text-caption mt-1 font-italic">
              {{ playerName(player.battleTag) }}: "{{ player.freeText }}"
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- ====== CONNECTION TOPOLOGY ====== -->
      <v-card variant="outlined" class="mb-4">
        <v-card-title class="text-subtitle-2 py-2">Connection Topology</v-card-title>
        <v-card-text>
          <div v-for="(player, pi) in report.players" :key="'topo-' + pi" class="mb-3 pa-3 rounded" style="border-left: 3px solid;" :style="{ borderColor: playerColors[pi] }">
            <div class="d-flex align-center ga-2 mb-2">
              <v-icon :color="playerColors[pi]" size="x-small">{{ mdiCircle }}</v-icon>
              <strong :style="{ color: playerColors[pi] }">{{ player.battleTag }}</strong>
              <v-chip v-if="player.isExplicit" size="x-small" color="warning" variant="flat">reported !lag</v-chip>
              <v-chip v-else size="x-small" variant="outlined" color="grey">auto-measured</v-chip>
            </div>
            <div class="d-flex align-center ga-1 flex-wrap text-caption">
              <!-- Topology nodes and arrows built from playerTopology computed -->
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

      <!-- ====== CONTINUOUS MONITORING ====== -->
      <v-expansion-panels v-model="expandedPanels" multiple class="mb-4">
        <v-expansion-panel value="continuous">
          <v-expansion-panel-title>
            <strong>Continuous Monitoring</strong>
            <span class="text-medium-emphasis text-caption ml-2">Data collected throughout the entire game</span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <!-- Player toggles -->
            <div class="d-flex ga-4 mb-3 justify-end">
              <v-checkbox
                v-for="(player, pi) in report.players"
                :key="'toggle-' + pi"
                v-model="visiblePlayers[pi]"
                :label="playerName(player.battleTag)"
                :color="playerColors[pi]"
                density="compact"
                hide-details
              />
            </div>

            <!-- Ping Timeline + Packet Loss Combined Chart -->
            <v-card variant="flat" class="mb-3 pa-3" color="transparent">
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="text-overline text-medium-emphasis">End-to-End Ping (client + server overlaid)</div>
                <div class="d-flex align-center ga-2">
                  <span class="text-caption text-medium-emphasis font-italic">Server ping realigned via reconnect events; game pauses may cause slight skew</span>
                  <span class="text-caption text-medium-emphasis">|</span>
                  <span class="text-caption text-medium-emphasis font-italic">Shift+click to place markers, scroll to zoom, drag to pan</span>
                  <v-btn size="x-small" variant="text" @click="resetPingChartZoom">Reset zoom</v-btn>
                </div>
              </div>
              <div
                v-if="pingChartData.datasets.length"
                style="cursor: crosshair;"
                @pointerdown="onChartPointerDown"
                @pointermove="onChartPointerMove"
                @pointerup="onChartPointerUp"
                @pointerleave="onChartPointerUp"
              >
                <bar-chart ref="pingChartRef" :chart-data="pingChartData" :chart-options="pingChartOptions" />
              </div>
              <div v-else class="text-medium-emphasis text-caption pa-4 text-center">No ping data available</div>
            </v-card>

            <!-- Summary Stats Table -->
            <v-card variant="flat" class="pa-3" color="transparent">
              <div class="text-overline text-medium-emphasis mb-2">Game-wide Summary</div>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Connection</th>
                    <th class="text-center" colspan="4">Client Ping</th>
                    <th class="text-center">Loss</th>
                    <th class="text-center" colspan="3">Server Ping</th>
                  </tr>
                  <tr class="text-caption text-medium-emphasis">
                    <th></th><th></th>
                    <th class="text-center">min</th><th class="text-center">avg</th>
                    <th class="text-center">max</th><th class="text-center">stddev</th>
                    <th class="text-center">rate</th>
                    <th class="text-center">min</th><th class="text-center">avg</th><th class="text-center">max</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(summary, si) in playerSummaries" :key="'sum-' + si">
                    <td><v-icon :color="playerColors[si]" size="x-small">{{ mdiCircle }}</v-icon> {{ summary.battleTag }}</td>
                    <td class="text-caption" :class="summary.isProxied ? 'text-warning' : ''">
                      {{ summary.connectionLabel }}
                    </td>
                    <td class="text-center">{{ summary.clientPing.min ?? '—' }}</td>
                    <td class="text-center">{{ summary.clientPing.avg ?? '—' }}</td>
                    <td class="text-center">{{ summary.clientPing.max ?? '—' }}</td>
                    <td class="text-center">{{ summary.clientPing.stddev ?? '—' }}</td>
                    <td class="text-center" :class="(summary.clientPing.lossRate ?? 0) > 1 ? 'text-warning' : 'text-success'">
                      {{ summary.clientPing.lossRate != null ? summary.clientPing.lossRate.toFixed(1) + '%' : '—' }}
                    </td>
                    <td class="text-center">{{ summary.serverPing.min ?? '—' }}</td>
                    <td class="text-center">{{ summary.serverPing.avg ?? '—' }}</td>
                    <td class="text-center">{{ summary.serverPing.max ?? '—' }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- ====== POINT-IN-TIME INSPECTOR ====== -->
        <v-expansion-panel value="inspector">
          <v-expansion-panel-title>
            <strong>Point-in-Time Inspector</strong>
            <span class="text-medium-emphasis text-caption ml-2">Drag markers on chart or use quick-jump buttons</span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <!-- Quick-jump buttons for events -->
            <div class="d-flex ga-2 flex-wrap mb-3 align-center">
              <span class="text-caption text-medium-emphasis">Jump to:</span>
              <v-btn
                v-for="(evt, ei) in inspectableEvents"
                :key="'evt-' + ei"
                variant="outlined"
                size="small"
                @click="jumpToEvent(evt.timestamp)"
              >
                {{ evt.label }}
              </v-btn>
            </div>

            <template v-if="inspectorLeftMs != null || inspectorRightMs != null">
              <!-- Player tabs for MTR -->
              <v-tabs v-model="inspectorPlayerTab" color="primary" class="mb-3">
                <v-tab
                  v-for="(player, pi) in report.players"
                  :key="'ptab-' + pi"
                  :value="pi"
                >
                  {{ playerName(player.battleTag) }} — forward
                </v-tab>
                <v-tab
                  v-for="(player, pi) in report.players"
                  :key="'rtab-' + pi"
                  :value="'reverse-' + pi"
                >
                  {{ playerName(player.battleTag) }} — reverse
                </v-tab>
              </v-tabs>

              <!-- Side-by-side comparison -->
              <v-row>
                <v-col cols="12" md="6">
                  <v-card variant="flat" color="transparent" class="pa-3">
                    <div class="text-overline mb-2" style="color: #42a5f5;">
                      <v-icon size="x-small" color="#42a5f5">{{ mdiCircle }}</v-icon>
                      L — {{ inspectorLeftMs != null ? formatDate(new Date(inspectorLeftMs).toISOString()) : 'not set' }}
                      <span v-if="inspectorLeftTrace" class="text-caption text-medium-emphasis ml-1">
                        (closest trace: {{ inspectorLeftTrace.hops.length }} hops, final {{ lastHopAvg(inspectorLeftTrace.hops) }})
                      </span>
                    </div>
                    <mtr-hop-table v-if="inspectorLeftTrace" :hops="inspectorLeftTrace.hops" />
                    <div v-else class="text-medium-emphasis text-caption">No MTR trace near this timestamp</div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card variant="flat" color="transparent" class="pa-3">
                    <div class="text-overline mb-2" style="color: #ffb74d;">
                      <v-icon size="x-small" color="#ffb74d">{{ mdiCircle }}</v-icon>
                      R — {{ inspectorRightMs != null ? formatDate(new Date(inspectorRightMs).toISOString()) : 'not set' }}
                      <span v-if="inspectorRightTrace" class="text-caption text-medium-emphasis ml-1">
                        (closest trace: {{ inspectorRightTrace.hops.length }} hops, final {{ lastHopAvg(inspectorRightTrace.hops) }})
                      </span>
                    </div>
                    <mtr-hop-table
                      v-if="inspectorRightTrace"
                      :hops="inspectorRightTrace.hops"
                      :baseline-hops="inspectorLeftTrace ? inspectorLeftTrace.hops : []"
                    />
                    <div v-else class="text-medium-emphasis text-caption">No MTR trace near this timestamp</div>
                  </v-card>
                </v-col>
              </v-row>
            </template>
            <div v-else class="text-medium-emphasis text-caption pa-4 text-center">
              Click or drag on the chart above to place inspection markers
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- ====== EVENT-TRIGGERED DATA ====== -->
        <v-expansion-panel value="events">
          <v-expansion-panel-title>
            <strong>Event-Triggered Data</strong>
            <span class="text-medium-emphasis text-caption ml-2">All-server baselines and burst measurements</span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <!-- All-server baseline table (expandable rows) -->
            <template v-for="(player, pi) in report.players" :key="'baseline-' + pi">
              <div v-if="player.diagnostics.allServerBaselines.length" class="mb-4">
                <div class="text-overline text-medium-emphasis mb-2">
                  All-Server Baselines — {{ playerName(player.battleTag) }}
                  ({{ player.diagnostics.allServerBaselines.length }} measurements)
                </div>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Time</th>
                      <th>Server</th>
                      <th>Target</th>
                      <th class="text-center">Hops</th>
                      <th class="text-center">Final Avg</th>
                      <th class="text-center">Final Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="(bl, bi) in player.diagnostics.allServerBaselines" :key="'bl-' + bi">
                      <tr
                        style="cursor: pointer;"
                        @click="toggleBaseline(pi, bi)"
                      >
                        <td style="width: 30px;">
                          <v-icon size="small">{{ expandedBaselines[pi + '-' + bi] ? mdiChevronDown : mdiChevronRight }}</v-icon>
                        </td>
                        <td class="text-caption">{{ formatDate(bl.timestamp) }}</td>
                        <td>{{ bl.serverName }}</td>
                        <td class="text-caption">{{ bl.target }}</td>
                        <td class="text-center">{{ bl.hops.length }}</td>
                        <td class="text-center">{{ lastHopAvg(bl.hops) }}</td>
                        <td class="text-center" :class="lastHopLoss(bl.hops) > 0 ? 'text-warning' : ''">
                          {{ lastHopLoss(bl.hops).toFixed(1) }}%
                        </td>
                      </tr>
                      <tr v-if="expandedBaselines[pi + '-' + bi]">
                        <td colspan="7" class="pa-0">
                          <div class="pa-3" style="background: rgba(0,0,0,0.03);">
                            <mtr-hop-table :hops="bl.hops" />
                          </div>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </v-table>
              </div>
            </template>

            <!-- Connection events -->
            <template v-for="(player, pi) in report.players" :key="'conn-' + pi">
              <div v-if="player.diagnostics.connectionEvents.length" class="mb-4">
                <div class="text-overline text-medium-emphasis mb-2">
                  Connection Events — {{ playerName(player.battleTag) }}
                </div>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Game Time</th>
                      <th>Event</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(ce, ci) in player.diagnostics.connectionEvents" :key="'ce-' + ci">
                      <td class="text-caption">{{ formatDate(ce.timestamp) }}</td>
                      <td>{{ formatGameTime(ce.gameTimeOffsetMs) }}</td>
                      <td>
                        <v-chip :color="[EConnectionEventType.Reconnect, EConnectionEventType.GamePaused, EConnectionEventType.StartLag].includes(ce.eventType) ? 'warning' : [EConnectionEventType.GameResumed, EConnectionEventType.StopLag].includes(ce.eventType) ? 'info' : 'error'" size="x-small" variant="flat">
                          {{ connectionEventLabel(ce.eventType) }}
                        </v-chip>
                      </td>
                      <td>{{ ce.durationMs != null ? (ce.durationMs / 1000).toFixed(1) + 's' : '—' }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </template>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- ====== RAW MTR DATA ====== -->
        <v-expansion-panel value="raw">
          <v-expansion-panel-title>
            <strong>All Raw MTR Measurements</strong>
            <span class="text-medium-emphasis text-caption ml-2">
              <template v-for="(player, pi) in report.players" :key="'rawcount-' + pi">
                {{ playerName(player.battleTag) }}: {{ player.diagnostics.targetMtr.length }} fwd + {{ player.diagnostics.reverseMtr.length }} rev
                <span v-if="pi < report.players.length - 1">&nbsp;|&nbsp;</span>
              </template>
            </span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <template v-for="(player, pi) in report.players" :key="'raw-' + pi">
              <div class="mb-4">
                <div class="text-overline text-medium-emphasis mb-2">
                  <v-icon :color="playerColors[pi]" size="x-small">{{ mdiCircle }}</v-icon>
                  {{ playerName(player.battleTag) }} — Forward MTR ({{ player.diagnostics.targetMtr.length }})
                </div>
                <v-expansion-panels variant="accordion">
                  <v-expansion-panel
                    v-for="(trace, ti) in player.diagnostics.targetMtr"
                    :key="'fwd-' + ti"
                  >
                    <v-expansion-panel-title class="text-caption">
                      {{ formatDate(trace.timestamp) }} → {{ trace.target }} ({{ trace.hops.length }} hops, final {{ lastHopAvg(trace.hops) }})
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <mtr-hop-table :hops="trace.hops" />
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
              <div v-if="player.diagnostics.reverseMtr.length" class="mb-4">
                <div class="text-overline text-medium-emphasis mb-2">
                  <v-icon :color="playerColors[pi]" size="x-small">{{ mdiCircle }}</v-icon>
                  {{ playerName(player.battleTag) }} — Reverse MTR ({{ player.diagnostics.reverseMtr.length }})
                </div>
                <v-expansion-panels variant="accordion">
                  <v-expansion-panel
                    v-for="(trace, ti) in player.diagnostics.reverseMtr"
                    :key="'rev-' + ti"
                  >
                    <v-expansion-panel-title class="text-caption">
                      {{ formatDate(trace.timestamp) }} → {{ trace.target }} ({{ trace.hops.length }} hops, final {{ lastHopAvg(trace.hops) }})
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <mtr-hop-table :hops="trace.hops" />
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </template>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-container>

    <v-container v-else>
      <v-alert type="warning">Report not found.</v-alert>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref } from "vue";
import { useLagReportsStore } from "@/store/admin/lagReports/store";
import { EConnectionEventType, EConnectionType, HopData, LagReportPlayer } from "@/store/admin/lagReports/types";
import { mdiArrowLeft, mdiChevronDown, mdiChevronRight, mdiCircle } from "@mdi/js";
import { useRouter } from "vue-router";
import { EAdminRouteName } from "@/router/types";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import MtrHopTable from "@/components/admin/MtrHopTable.vue";
import { ChartData, ChartOptions } from "chart.js";

const PLAYER_COLORS = ["#ef5350", "#42a5f5", "#66bb6a", "#ffb74d", "#ab47bc", "#26c6da", "#ec407a", "#8d6e63"];

export default defineComponent({
  name: "AdminLagReportDetail",
  components: { BarChart, MtrHopTable },
  props: {
    id: { type: String, required: true },
  },
  setup(props) {
    const lagReportsStore = useLagReportsStore();
    const router = useRouter();

    const report = computed(() => lagReportsStore.selectedReport);
    const loading = computed(() => lagReportsStore.selectedReportLoading);

    const expandedPanels = ref(["continuous", "inspector"]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pingChartRef = ref<any>(null);
    const inspectorLeftMs = ref<number | null>(null);
    const inspectorRightMs = ref<number | null>(null);
    const draggingMarker = ref<"left" | "right" | null>(null);
    const inspectorPlayerTab = ref(0);
    const visiblePlayers = reactive<Record<number, boolean>>({});
    const expandedBaselines = reactive<Record<string, boolean>>({});

    const playerColors = computed(() => {
      return (report.value?.players ?? []).map((_, i) => PLAYER_COLORS[i % PLAYER_COLORS.length]);
    });

    function playerName(battleTag: string): string {
      return battleTag.split("#")[0];
    }

    function isProxied(player: LagReportPlayer): boolean {
      return player.connectionType === EConnectionType.Proxied;
    }

    function formatDate(iso: string): string {
      if (!iso) return "";
      return new Date(iso).toLocaleString();
    }

    function formatGameTime(ms: number): string {
      const totalSec = Math.floor(ms / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      return `${min}:${sec.toString().padStart(2, "0")}`;
    }

    const connectionEventLabelMap: Record<string, string> = {
      [EConnectionEventType.Reconnect]: "Reconnected",
      [EConnectionEventType.FailureDisconnect]: "Disconnected",
      [EConnectionEventType.GameCrashed]: "Game crashed",
      [EConnectionEventType.GamePaused]: "Game paused",
      [EConnectionEventType.GameResumed]: "Game resumed",
      [EConnectionEventType.StartLag]: "Lag detected",
      [EConnectionEventType.StopLag]: "Lag resolved",
    };

    function connectionEventLabel(eventType: string): string {
      return connectionEventLabelMap[eventType] ?? eventType;
    }

    function lastHopAvg(hops: HopData[]): string {
      if (!hops.length) return "—";
      const last = hops[hops.length - 1];
      return last.avgRttMs != null ? Math.round(last.avgRttMs) + "ms" : "—";
    }

    function lastHopLoss(hops: HopData[]): number {
      if (!hops.length) return 0;
      return hops[hops.length - 1].lossPercent;
    }

    type TopoSegment =
      | { type: "node"; label: string; role: string; subtitle?: string; borderColor: string; labelColor: string }
      | { type: "arrow"; lines: { label: string; arrow: string; class: string }[] };

    function playerTopology(player: LagReportPlayer): TopoSegment[] {
      const r = report.value;
      if (!r) return [];

      const hasFwd = player.diagnostics.targetMtr.length > 0;
      const hasRev = player.diagnostics.reverseMtr.length > 0;
      const proxied = isProxied(player) && player.proxyName;
      const pi = r.players.indexOf(player);
      const color = PLAYER_COLORS[pi >= 0 ? pi % PLAYER_COLORS.length : 0];

      const segments: TopoSegment[] = [];

      // Client node
      segments.push({
        type: "node",
        label: playerName(player.battleTag),
        role: "client",
        subtitle: player.clientIp ?? undefined,
        borderColor: "",
        labelColor: color,
      });

      if (proxied) {
        // Client → Proxy leg
        const lines: { label: string; arrow: string; class: string }[] = [];
        if (hasFwd) lines.push({ label: "client MTR", arrow: "→→→", class: "text-info" });
        lines.push({ label: "client ping (e2e)", arrow: "· · ·→", class: "text-medium-emphasis" });
        lines.push({ label: "server ping (e2e)", arrow: "←· · ·", class: "text-medium-emphasis" });
        segments.push({ type: "arrow", lines });

        // Proxy node
        segments.push({
          type: "node",
          label: player.proxyName!,
          role: "proxy",
          subtitle: player.proxyIp ? `${player.proxyIp}${player.proxyPort ? ":" + player.proxyPort : ""}` : undefined,
          borderColor: "orange",
          labelColor: "orange",
        });

        // Proxy → Server leg
        const lines2: { label: string; arrow: string; class: string }[] = [];
        lines2.push({ label: "client ping (e2e)", arrow: "· · ·→", class: "text-medium-emphasis" });
        lines2.push({ label: "server ping (e2e)", arrow: "←· · ·", class: "text-medium-emphasis" });
        if (hasRev) lines2.push({ label: "reverse MTR", arrow: "←←←", class: "text-success" });
        segments.push({ type: "arrow", lines: lines2 });
      } else {
        // Direct: all measurements cover the full path
        const lines: { label: string; arrow: string; class: string }[] = [];
        if (hasFwd) lines.push({ label: "client MTR", arrow: "→→→", class: "text-info" });
        lines.push({ label: "client ping (e2e)", arrow: "· · ·→", class: "text-medium-emphasis" });
        lines.push({ label: "server ping (e2e)", arrow: "←· · ·", class: "text-medium-emphasis" });
        if (hasRev) lines.push({ label: "reverse MTR", arrow: "←←←", class: "text-success" });
        segments.push({ type: "arrow", lines });
      }

      // Server node
      segments.push({
        type: "node",
        label: r.serverNodeName,
        role: "game server",
        borderColor: "#4fc3f7",
        labelColor: "#4fc3f7",
      });

      return segments;
    }

    function topologyCoverageNotes(player: LagReportPlayer): string[] {
      const r = report.value;
      if (!r) return [];
      const notes: string[] = [];
      const name = playerName(player.battleTag);
      const proxied = isProxied(player) && player.proxyName;
      const fwdTargets = [...new Set(player.diagnostics.targetMtr.map((t) => t.target))];
      const revTargets = [...new Set(player.diagnostics.reverseMtr.map((t) => t.target))];

      if (fwdTargets.length) {
        const dest = proxied ? player.proxyName ?? fwdTargets[0] : r.serverNodeName;
        notes.push(`▸ Client MTR covers: ${name} → ${dest} (${fwdTargets.join(", ")})`);
      }
      if (revTargets.length) {
        const dest = proxied ? player.proxyName ?? revTargets[0] : name;
        notes.push(`▸ Reverse MTR covers: ${r.serverNodeName} → ${dest} (${revTargets.join(", ")})`);
      }
      if (proxied) {
        notes.push(`⚠ No hop-level data through ${player.proxyName} — only e2e ping covers the full path`);
      }

      return notes;
    }

    function toggleBaseline(pi: number, bi: number) {
      const key = pi + "-" + bi;
      expandedBaselines[key] = !expandedBaselines[key];
    }

    function getChartXFromEvent(event: PointerEvent): number | null {
      const chart = pingChartRef.value?.chart;
      if (!chart?.scales?.x) return null;
      const rect = chart.canvas.getBoundingClientRect();
      const px = event.clientX - rect.left;
      return chart.scales.x.getValueForPixel(px);
    }

    // Shift+click/drag to place/move markers. Regular drag = pan (handled by zoom plugin).
    function onChartPointerDown(event: PointerEvent) {
      if (!event.shiftKey) return; // Let regular clicks/drags pass through to zoom plugin
      event.preventDefault();
      event.stopPropagation();

      const ms = getChartXFromEvent(event);
      if (ms == null) return;
      const chart = pingChartRef.value?.chart;
      if (!chart?.scales?.x) return;

      const GRAB_THRESHOLD = 12; // pixels
      const clickPx = event.clientX - chart.canvas.getBoundingClientRect().left;

      // Check if near an existing marker
      if (inspectorLeftMs.value != null) {
        const leftPx = chart.scales.x.getPixelForValue(inspectorLeftMs.value);
        if (Math.abs(clickPx - leftPx) < GRAB_THRESHOLD) {
          draggingMarker.value = "left";
          return;
        }
      }
      if (inspectorRightMs.value != null) {
        const rightPx = chart.scales.x.getPixelForValue(inspectorRightMs.value);
        if (Math.abs(clickPx - rightPx) < GRAB_THRESHOLD) {
          draggingMarker.value = "right";
          return;
        }
      }

      // Not near a marker — place the nearest unset marker, or move the closer one
      if (inspectorLeftMs.value == null) {
        inspectorLeftMs.value = ms;
        draggingMarker.value = "left";
      } else if (inspectorRightMs.value == null) {
        inspectorRightMs.value = ms;
        draggingMarker.value = "right";
      } else {
        // Both set — move the closer one
        const leftPx = chart.scales.x.getPixelForValue(inspectorLeftMs.value);
        const rightPx = chart.scales.x.getPixelForValue(inspectorRightMs.value);
        if (Math.abs(clickPx - leftPx) < Math.abs(clickPx - rightPx)) {
          inspectorLeftMs.value = ms;
          draggingMarker.value = "left";
        } else {
          inspectorRightMs.value = ms;
          draggingMarker.value = "right";
        }
      }
      openInspector();
    }

    function onChartPointerMove(event: PointerEvent) {
      if (!draggingMarker.value) return;
      event.preventDefault();
      const ms = getChartXFromEvent(event);
      if (ms == null) return;
      if (draggingMarker.value === "left") {
        inspectorLeftMs.value = ms;
      } else {
        inspectorRightMs.value = ms;
      }
    }

    function onChartPointerUp() {
      draggingMarker.value = null;
    }

    function openInspector() {
      if (!expandedPanels.value.includes("inspector")) {
        expandedPanels.value.push("inspector");
      }
    }

    function resetPingChartZoom() {
      // vue-chartjs components expose the Chart.js instance via .chart
      const chartComponent = pingChartRef.value;
      chartComponent?.chart?.resetZoom();
    }

    function goBack() {
      router.push({ name: EAdminRouteName.LAG_REPORTS });
    }

    // Earliest client ping timestamp — used as game start anchor for server-side ping
    const gameStartMs = computed(() => {
      const r = report.value;
      if (!r) return 0;
      let earliest = Infinity;
      for (const player of r.players) {
        for (const p of player.diagnostics.pingHistory) {
          const t = new Date(p.timestamp).getTime();
          if (t < earliest) earliest = t;
        }
      }
      return earliest === Infinity ? new Date(r.createdAt).getTime() : earliest;
    });

    // Collect disconnect pauses (Reconnect events with duration) across all players.
    // Used to realign server-side ping (game-time seconds) to wall-clock.
    // During a disconnect, game-time freezes but wall-clock advances by durationMs.
    const gameClockPauses = computed(() => {
      const r = report.value;
      if (!r) return [];
      const pauses: { gameTimeSec: number; durationMs: number }[] = [];
      for (const player of r.players) {
        for (const ce of player.diagnostics.connectionEvents) {
          if (
            (ce.eventType === EConnectionEventType.Reconnect ||
             ce.eventType === EConnectionEventType.GameResumed ||
             ce.eventType === EConnectionEventType.StopLag) &&
            ce.durationMs
          ) {
            pauses.push({ gameTimeSec: ce.gameTimeOffsetMs / 1000, durationMs: ce.durationMs });
          }
        }
      }
      // Deduplicate by gameTimeSec (same event affects all players)
      const seen = new Set<number>();
      return pauses.filter((p) => {
        if (seen.has(p.gameTimeSec)) return false;
        seen.add(p.gameTimeSec);
        return true;
      }).sort((a, b) => a.gameTimeSec - b.gameTimeSec);
    });

    // Convert server-side game-time seconds to wall-clock ms,
    // accounting for disconnect pauses where game-time froze.
    function gameTimeToWallClockMs(gameTimeSec: number): number {
      let extraMs = 0;
      for (const pause of gameClockPauses.value) {
        if (pause.gameTimeSec < gameTimeSec) {
          extraMs += pause.durationMs;
        } else {
          break;
        }
      }
      return gameStartMs.value + gameTimeSec * 1000 + extraMs;
    }

    // ── Ping + Loss combined chart ──────────────────────────────────
    // Uses wall-clock time on x-axis (time scale). Annotations positioned
    // by their wall-clock timestamp; labels show game time for readability.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pingChartData = computed<ChartData<any>>(() => {
      const r = report.value;
      if (!r) return { datasets: [] };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const datasets: any[] = [];

      r.players.forEach((player, pi) => {
        if (!visiblePlayers[pi]) return;
        const color = PLAYER_COLORS[pi % PLAYER_COLORS.length];

        // Client ping line
        if (player.diagnostics.pingHistory.length) {
          datasets.push({
            type: "line",
            label: `${playerName(player.battleTag)} client`,
            data: player.diagnostics.pingHistory.map((p) => ({
              x: new Date(p.timestamp).getTime(),
              y: p.avg ?? 0,
            })),
            borderColor: color,
            backgroundColor: "transparent",
            borderWidth: 1.5,
            pointRadius: 1,
            tension: 0.2,
            yAxisID: "y",
            order: 1,
          });
        }

        // Client loss bars
        const lossPoints = player.diagnostics.pingHistory.filter((p) => p.lossRate > 0);
        if (lossPoints.length) {
          datasets.push({
            type: "bar",
            label: `${playerName(player.battleTag)} loss`,
            data: lossPoints.map((p) => ({
              x: new Date(p.timestamp).getTime(),
              y: p.lossRate * 100,
            })),
            backgroundColor: color + "40",
            borderColor: color,
            borderWidth: 1,
            maxBarThickness: 8,
            yAxisID: "yLoss",
            order: 2,
          });
        }
      });

      // Server-side ping (dashed lines) — realigned from game-time to wall-clock
      // Insert null gaps at disconnect boundaries to break the line
      if (r.serverSidePing) {
        r.serverSidePing.forEach((sp, si) => {
          const pi = r.players.findIndex((p) => p.battleTag === sp.playerName);
          if (pi >= 0 && !visiblePlayers[pi]) return;
          const color = pi >= 0 ? PLAYER_COLORS[pi % PLAYER_COLORS.length] : PLAYER_COLORS[si % PLAYER_COLORS.length];
          if (sp.samples.length) {
            const points: { x: number; y: number | null }[] = [];
            const pauses = gameClockPauses.value;
            let prevTime = -1;
            for (const s of sp.samples) {
              // If a disconnect pause falls between the previous and current sample, insert null gap
              for (const pause of pauses) {
                if (pause.gameTimeSec > prevTime && pause.gameTimeSec <= s.time) {
                  points.push({ x: gameTimeToWallClockMs(pause.gameTimeSec), y: null });
                }
              }
              points.push({ x: gameTimeToWallClockMs(s.time), y: s.avg ?? 0 });
              prevTime = s.time;
            }
            datasets.push({
              type: "line",
              label: `${sp.playerName.split("#")[0]} server`,
              data: points,
              borderColor: color,
              backgroundColor: "transparent",
              borderWidth: 1,
              borderDash: [4, 3],
              pointRadius: 0,
              tension: 0.2,
              spanGaps: false,
              yAxisID: "y",
              order: 1,
            });
          }
        });
      }

      return { datasets };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pingChartOptions = computed<ChartOptions<any>>(() => {
      const annotations: Record<string, unknown> = {};
      const r = report.value;
      if (r) {
        let idx = 0;
        r.players.forEach((player) => {
          player.diagnostics.lagEvents.forEach((le) => {
            const ts = new Date(le.timestamp).getTime();
            annotations[`lag-${idx}`] = {
              type: "line",
              xMin: ts,
              xMax: ts,
              borderColor: "#ffb74d",
              borderWidth: 2,
              label: {
                display: true,
                content: `!lag ${formatGameTime(le.gameTimeOffsetMs)}`,
                position: "start",
                backgroundColor: "#ffb74d",
                color: "#000",
                font: { size: 9 },
              },
            };
            idx++;
          });
          const annotationColorMap: Record<string, string> = {
            [EConnectionEventType.Reconnect]: "#ff9800",
            [EConnectionEventType.FailureDisconnect]: "#f44336",
            [EConnectionEventType.GameCrashed]: "#f44336",
            [EConnectionEventType.GamePaused]: "#ff9800",
            [EConnectionEventType.GameResumed]: "#2196f3",
            [EConnectionEventType.StartLag]: "#ff9800",
            [EConnectionEventType.StopLag]: "#2196f3",
          };

          player.diagnostics.connectionEvents.forEach((ce) => {
            const ts = new Date(ce.timestamp).getTime();
            // For reconnects, add a "Disconnected" marker at the start of the outage
            if (ce.eventType === EConnectionEventType.Reconnect && ce.durationMs) {
              const disconnectTs = ts - ce.durationMs;
              annotations[`disc-${idx}`] = {
                type: "line",
                xMin: disconnectTs,
                xMax: disconnectTs,
                borderColor: "#f44336",
                borderWidth: 2,
                label: {
                  display: true,
                  content: "Disconnected",
                  position: "start",
                  backgroundColor: "#f44336",
                  color: "#fff",
                  font: { size: 9 },
                },
              };
            }

            const color = annotationColorMap[ce.eventType] ?? "#f44336";
            const label = connectionEventLabelMap[ce.eventType] ?? ce.eventType;

            annotations[`conn-${idx}`] = {
              type: "line",
              xMin: ts,
              xMax: ts,
              borderColor: color,
              borderWidth: 2,
              borderDash: [4, 2],
              label: {
                display: true,
                content: label,
                position: "start",
                backgroundColor: color,
                color: "#fff",
                font: { size: 9 },
              },
            };
            idx++;
          });
        });
      }
      return {
        maintainAspectRatio: true,
        aspectRatio: 4,
        plugins: {
          legend: { display: true, position: "bottom", labels: { usePointStyle: true, boxWidth: 8 } },
          annotation: {
            annotations: {
              ...annotations,
              // Inspector marker lines
              ...(inspectorLeftMs.value != null ? {
                inspectorLeft: {
                  type: "line",
                  xMin: inspectorLeftMs.value,
                  xMax: inspectorLeftMs.value,
                  borderColor: "#42a5f5",
                  borderWidth: 2,
                  borderDash: [6, 3],
                  label: {
                    display: true,
                    content: "L",
                    position: "end",
                    backgroundColor: "#42a5f5",
                    color: "#fff",
                    font: { size: 10, weight: "bold" },
                  },
                },
              } : {}),
              ...(inspectorRightMs.value != null ? {
                inspectorRight: {
                  type: "line",
                  xMin: inspectorRightMs.value,
                  xMax: inspectorRightMs.value,
                  borderColor: "#ffb74d",
                  borderWidth: 2,
                  borderDash: [6, 3],
                  label: {
                    display: true,
                    content: "R",
                    position: "end",
                    backgroundColor: "#ffb74d",
                    color: "#000",
                    font: { size: 10, weight: "bold" },
                  },
                },
              } : {}),
            },
          },
          zoom: {
            pan: { enabled: true, mode: "x" },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: "x",
            },
          },
        },
        scales: {
          x: {
            type: "time",
            time: { tooltipFormat: "HH:mm:ss", displayFormats: { second: "HH:mm:ss", minute: "HH:mm" } },
          },
          y: { beginAtZero: true, title: { display: true, text: "ms" } },
          yLoss: {
            position: "right",
            beginAtZero: true,
            title: { display: true, text: "% loss" },
            grid: { drawOnChartArea: false },
          },
        },
        elements: { point: { radius: 1, hitRadius: 8 } },
      };
    });

    // ── Summary Stats ────────────────────────────────────────────────
    const playerSummaries = computed(() => {
      const r = report.value;
      if (!r) return [];
      return r.players.map((player, _pi) => {
        const ping = player.diagnostics.pingHistory;
        const clientStats = computePingStats(ping.map((p) => p.avg).filter((v): v is number => v != null));
        const lossRates = ping.map((p) => p.lossRate).filter((v) => v != null);
        const avgLoss = lossRates.length ? (lossRates.reduce((a, b) => a + b, 0) / lossRates.length) * 100 : null;

        const spd = r.serverSidePing?.find((s) => s.playerName === player.battleTag);
        const serverStats = spd
          ? computePingStats(spd.samples.map((s) => s.avg).filter((v): v is number => v != null))
          : { min: null, avg: null, max: null };

        return {
          battleTag: player.battleTag,
          isProxied: isProxied(player),
          connectionLabel: isProxied(player)
            ? `${player.proxyName ?? "proxy"} → ${r.serverNodeName}`
            : "Direct",
          clientPing: { ...clientStats, stddev: computeStddev(ping.map((p) => p.avg).filter((v): v is number => v != null)), lossRate: avgLoss },
          serverPing: serverStats,
        };
      });
    });

    function computePingStats(values: number[]): { min: number | null; avg: number | null; max: number | null } {
      if (!values.length) return { min: null, avg: null, max: null };
      return {
        min: Math.round(Math.min(...values)),
        avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
        max: Math.round(Math.max(...values)),
      };
    }

    function computeStddev(values: number[]): number | null {
      if (values.length < 2) return null;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
      return Math.round(Math.sqrt(variance) * 10) / 10;
    }

    // ── Point-in-Time Inspector ──────────────────────────────────────
    const inspectableEvents = computed(() => {
      const r = report.value;
      if (!r) return [];
      const events: { label: string; timestamp: string }[] = [];
      r.players.forEach((player) => {
        player.diagnostics.lagEvents.forEach((le) => {
          events.push({
            label: `!lag ${formatGameTime(le.gameTimeOffsetMs)} (${playerName(player.battleTag)})`,
            timestamp: le.timestamp,
          });
        });
        player.diagnostics.connectionEvents.forEach((ce) => {
          // For reconnects, add the disconnect start as a separate inspectable point
          if (ce.eventType === EConnectionEventType.Reconnect && ce.durationMs) {
            const disconnectMs = new Date(ce.timestamp).getTime() - ce.durationMs;
            events.push({
              label: `Disconnected ${formatGameTime(ce.gameTimeOffsetMs)} (${playerName(player.battleTag)})`,
              timestamp: new Date(disconnectMs).toISOString(),
            });
          }
          events.push({
            label: `${connectionEventLabel(ce.eventType)} ${formatGameTime(ce.gameTimeOffsetMs)} (${playerName(player.battleTag)})`,
            timestamp: ce.timestamp,
          });
        });
      });
      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return events;
    });

    function jumpToEvent(timestamp: string) {
      const ms = new Date(timestamp).getTime();
      inspectorLeftMs.value = gameStartMs.value;
      inspectorRightMs.value = ms;
      openInspector();
    }

    function findClosestTrace(player: LagReportPlayer, wallClockMs: number, direction: "forward" | "reverse") {
      const traces = direction === "forward" ? player.diagnostics.targetMtr : player.diagnostics.reverseMtr;
      if (!traces.length) return null;
      let closest = traces[0];
      let minDiff = Math.abs(new Date(closest.timestamp).getTime() - wallClockMs);
      for (const t of traces) {
        const diff = Math.abs(new Date(t.timestamp).getTime() - wallClockMs);
        if (diff < minDiff) {
          closest = t;
          minDiff = diff;
        }
      }
      return closest;
    }

    function getInspectorTrace(wallClockMs: number | null) {
      const r = report.value;
      if (!r || wallClockMs == null) return null;
      const tab = inspectorPlayerTab.value;
      const isReverse = typeof tab === "string" && tab.startsWith("reverse-");
      const pi = isReverse ? parseInt(tab.toString().replace("reverse-", "")) : (tab as number);
      const player = r.players[pi];
      if (!player) return null;
      return findClosestTrace(player, wallClockMs, isReverse ? "reverse" : "forward");
    }

    const inspectorLeftTrace = computed(() => getInspectorTrace(inspectorLeftMs.value));
    const inspectorRightTrace = computed(() => getInspectorTrace(inspectorRightMs.value));

    // ── Init ─────────────────────────────────────────────────────────
    onMounted(async () => {
      await lagReportsStore.loadReport(props.id);
      // Initialize all players as visible
      if (report.value) {
        report.value.players.forEach((_, i) => {
          visiblePlayers[i] = true;
        });
      }
    });

    return {
      report,
      loading,
      expandedPanels,
      inspectorLeftMs,
      inspectorRightMs,
      inspectorLeftTrace,
      inspectorRightTrace,
      inspectorPlayerTab,
      onChartPointerDown,
      onChartPointerMove,
      onChartPointerUp,
      visiblePlayers,
      playerColors,
      playerName,
      formatDate,
      formatGameTime,
      lastHopAvg,
      lastHopLoss,
      goBack,
      pingChartRef,
      pingChartData,
      pingChartOptions,
      resetPingChartZoom,
      playerSummaries,
      inspectableEvents,
      jumpToEvent,
      isProxied,
      playerTopology,
      topologyCoverageNotes,
      expandedBaselines,
      toggleBaseline,
      EConnectionEventType,
      connectionEventLabel,
      mdiArrowLeft,
      mdiChevronDown,
      mdiChevronRight,
      mdiCircle,
    };
  },
});
</script>
