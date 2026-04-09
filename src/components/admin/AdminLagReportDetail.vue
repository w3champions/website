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
                :color="ce.eventType === 'Reconnect' ? 'warning' : 'error'"
                variant="flat"
              >
                {{ ce.eventType }} {{ formatGameTime(ce.gameTimeOffsetMs) }} ({{ playerName(player.battleTag) }})
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
              <!-- Client -->
              <v-sheet rounded border class="pa-2 text-center" min-width="80">
                <div :style="{ color: playerColors[pi] }" class="font-weight-bold">{{ playerName(player.battleTag) }}</div>
                <div class="text-medium-emphasis" style="font-size: 10px;">client</div>
                <div v-if="player.clientIp" class="text-medium-emphasis" style="font-size: 9px;">{{ player.clientIp }}</div>
              </v-sheet>
              <!-- Arrow: client → proxy/server -->
              <div class="text-center px-1">
                <div class="text-info" style="font-size: 9px;">client MTR</div>
                <div class="text-info">&rarr;&rarr;&rarr;</div>
              </div>
              <!-- Proxy (if proxied) -->
              <template v-if="player.connectionType === 'Proxied' && player.proxyName">
                <v-sheet rounded border class="pa-2 text-center" min-width="80" style="border-color: orange !important;">
                  <div style="color: orange;" class="font-weight-bold">{{ player.proxyName }}</div>
                  <div class="text-medium-emphasis" style="font-size: 10px;">proxy</div>
                  <div v-if="player.proxyIp" class="text-medium-emphasis" style="font-size: 9px;">{{ player.proxyIp }}{{ player.proxyPort ? ':' + player.proxyPort : '' }}</div>
                </v-sheet>
                <div class="text-center px-1">
                  <div class="text-error" style="font-size: 9px;">no MTR coverage</div>
                  <div class="text-medium-emphasis">- - -</div>
                </div>
              </template>
              <!-- Server -->
              <v-sheet rounded border class="pa-2 text-center" min-width="80" style="border-color: #4fc3f7 !important;">
                <div style="color: #4fc3f7;" class="font-weight-bold">{{ report.serverNodeName }}</div>
                <div class="text-medium-emphasis" style="font-size: 10px;">game server</div>
              </v-sheet>
              <!-- Reverse MTR arrow -->
              <template v-if="player.diagnostics.reverseMtr.length">
                <div class="text-center px-1">
                  <div class="text-success" style="font-size: 9px;">reverse MTR</div>
                  <div class="text-success">&larr;&larr;&larr;</div>
                </div>
                <v-sheet rounded border class="pa-2 text-center" min-width="80" style="opacity: 0.6; border-style: dashed !important;">
                  <div style="color: orange;">{{ player.proxyName || report.serverNodeName }}</div>
                  <div class="text-medium-emphasis" style="font-size: 10px;">reverse target</div>
                </v-sheet>
              </template>
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
            <div class="d-flex ga-4 mb-3">
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

            <!-- Ping Timeline Chart -->
            <v-card variant="flat" class="mb-3 pa-3" color="surface-variant">
              <div class="text-overline text-medium-emphasis mb-2">End-to-End Ping (client + server overlaid)</div>
              <line-chart v-if="pingChartData.datasets.length" :chart-data="pingChartData" :chart-options="pingChartOptions" />
              <div v-else class="text-medium-emphasis text-caption pa-4 text-center">No ping data available</div>
            </v-card>

            <!-- Packet Loss Chart -->
            <v-card variant="flat" class="mb-3 pa-3" color="surface-variant">
              <div class="text-overline text-medium-emphasis mb-2">Client Packet Loss</div>
              <bar-chart v-if="lossChartData.datasets.length" :chart-data="lossChartData" :chart-options="lossChartOptions" />
              <div v-else class="text-medium-emphasis text-caption pa-4 text-center">No loss data available</div>
            </v-card>

            <!-- Summary Stats Table -->
            <v-card variant="flat" class="pa-3" color="surface-variant">
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
            <span class="text-medium-emphasis text-caption ml-2">Select an event to inspect MTR data</span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>

            <!-- Event selector -->
            <div class="d-flex ga-2 flex-wrap mb-3">
              <v-btn
                v-for="(evt, ei) in inspectableEvents"
                :key="'evt-' + ei"
                :variant="selectedEventIndex === ei ? 'flat' : 'outlined'"
                :color="selectedEventIndex === ei ? 'warning' : 'default'"
                size="small"
                @click="selectedEventIndex = ei"
              >
                {{ evt.label }}
              </v-btn>
            </div>

            <template v-if="selectedEvent">
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

              <!-- Side-by-side: baseline vs selected -->
              <v-row>
                <v-col cols="12" md="6">
                  <v-card variant="flat" color="surface-variant" class="pa-3">
                    <div class="text-overline text-success mb-2">Baseline (Game Start)</div>
                    <mtr-hop-table :hops="baselineHops" />
                  </v-card>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card variant="flat" color="surface-variant" class="pa-3">
                    <div class="text-overline text-warning mb-2">
                      At {{ selectedEvent.label }}
                      <v-chip size="x-small" color="warning" variant="flat" class="ml-1">EVENT</v-chip>
                    </div>
                    <mtr-hop-table :hops="selectedEventHops" :baseline-hops="baselineHops" />
                  </v-card>
                </v-col>
              </v-row>

              <!-- User annotation for this event -->
              <div
                v-if="selectedEventAnnotation"
                class="mt-3 pa-3 rounded"
                style="border: 1px solid rgba(255,183,77,0.3);"
              >
                <span class="text-overline text-warning">User Annotation</span><br>
                <span>"{{ selectedEventAnnotation }}"</span>
              </div>
            </template>
            <div v-else class="text-medium-emphasis text-caption pa-4 text-center">
              Select an event above to inspect MTR measurements
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

            <!-- All-server baseline table -->
            <template v-for="(player, pi) in report.players" :key="'baseline-' + pi">
              <div v-if="player.diagnostics.allServerBaselines.length" class="mb-4">
                <div class="text-overline text-medium-emphasis mb-2">
                  All-Server Baselines — {{ playerName(player.battleTag) }}
                  ({{ player.diagnostics.allServerBaselines.length }} measurements)
                </div>
                <v-table density="compact">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Server</th>
                      <th>Target</th>
                      <th class="text-center">Hops</th>
                      <th class="text-center">Final Avg</th>
                      <th class="text-center">Final Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(bl, bi) in player.diagnostics.allServerBaselines" :key="'bl-' + bi">
                      <td class="text-caption">{{ formatDate(bl.timestamp) }}</td>
                      <td>{{ bl.serverName }}</td>
                      <td class="text-caption">{{ bl.target }}</td>
                      <td class="text-center">{{ bl.hops.length }}</td>
                      <td class="text-center">{{ lastHopAvg(bl.hops) }}</td>
                      <td class="text-center" :class="lastHopLoss(bl.hops) > 0 ? 'text-warning' : ''">
                        {{ lastHopLoss(bl.hops).toFixed(1) }}%
                      </td>
                    </tr>
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
                        <v-chip :color="ce.eventType === 'Reconnect' ? 'warning' : 'error'" size="x-small" variant="flat">
                          {{ ce.eventType }}
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

        <!-- ====== SERVER-SIDE PING ====== -->
        <v-expansion-panel v-if="report.serverSidePing && report.serverSidePing.length" value="serverping">
          <v-expansion-panel-title>
            <strong>Server-Side Ping Data</strong>
            <span class="text-medium-emphasis text-caption ml-2">(from flo-stats)</span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card variant="flat" class="pa-3" color="surface-variant">
              <line-chart v-if="serverPingChartData.datasets.length" :chart-data="serverPingChartData" :chart-options="serverPingChartOptions" />
            </v-card>
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
import { HopData, LagReportDetail, LagReportPlayer } from "@/store/admin/lagReports/types";
import { mdiArrowLeft, mdiCircle } from "@mdi/js";
import { useRouter } from "vue-router";
import { EAdminRouteName } from "@/router/types";
import LineChart from "@/components/overall-statistics/LineChart.vue";
import BarChart from "@/components/overall-statistics/BarChart.vue";
import MtrHopTable from "@/components/admin/MtrHopTable.vue";
import { ChartData, ChartOptions } from "chart.js";

const PLAYER_COLORS = ["#ef5350", "#42a5f5", "#66bb6a", "#ffb74d", "#ab47bc", "#26c6da", "#ec407a", "#8d6e63"];

export default defineComponent({
  name: "AdminLagReportDetail",
  components: { LineChart, BarChart, MtrHopTable },
  props: {
    id: { type: String, required: true },
  },
  setup(props) {
    const lagReportsStore = useLagReportsStore();
    const router = useRouter();

    const report = computed(() => lagReportsStore.selectedReport);
    const loading = computed(() => lagReportsStore.selectedReportLoading);

    const expandedPanels = ref(["continuous", "inspector"]);
    const selectedEventIndex = ref<number | null>(null);
    const inspectorPlayerTab = ref(0);
    const visiblePlayers = reactive<Record<number, boolean>>({});

    const playerColors = computed(() => {
      return (report.value?.players ?? []).map((_, i) => PLAYER_COLORS[i % PLAYER_COLORS.length]);
    });

    function playerName(battleTag: string): string {
      return battleTag.split("#")[0];
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

    function lastHopAvg(hops: HopData[]): string {
      if (!hops.length) return "—";
      const last = hops[hops.length - 1];
      return last.avgRttMs != null ? Math.round(last.avgRttMs) + "ms" : "—";
    }

    function lastHopLoss(hops: HopData[]): number {
      if (!hops.length) return 0;
      return hops[hops.length - 1].lossPercent;
    }

    function goBack() {
      router.push({ name: EAdminRouteName.LAG_REPORTS });
    }

    // ── Ping timeline chart ──────────────────────────────────────────
    const pingChartData = computed<ChartData<"line">>(() => {
      const r = report.value;
      if (!r) return { labels: [], datasets: [] };

      const datasets: ChartData<"line">["datasets"] = [];
      r.players.forEach((player, pi) => {
        if (!visiblePlayers[pi]) return;
        const color = PLAYER_COLORS[pi % PLAYER_COLORS.length];
        if (player.diagnostics.pingHistory.length) {
          datasets.push({
            label: `${playerName(player.battleTag)} client`,
            data: player.diagnostics.pingHistory.map((p) => ({
              x: new Date(p.timestamp).getTime(),
              y: p.avg ?? 0,
            })) as never,
            borderColor: color,
            backgroundColor: "transparent",
            borderWidth: 1.5,
            pointRadius: 0.5,
            tension: 0.2,
          });
        }
      });

      // Server-side ping
      if (r.serverSidePing) {
        const gameStart = r.createdAt ? new Date(r.createdAt).getTime() : 0;
        r.serverSidePing.forEach((sp, si) => {
          const pi = r.players.findIndex((p) => p.battleTag === sp.playerName);
          if (pi >= 0 && !visiblePlayers[pi]) return;
          const color = pi >= 0 ? PLAYER_COLORS[pi % PLAYER_COLORS.length] : PLAYER_COLORS[si % PLAYER_COLORS.length];
          if (sp.samples.length) {
            datasets.push({
              label: `${sp.playerName.split("#")[0]} server`,
              data: sp.samples.map((s) => ({
                x: gameStart + s.time * 1000,
                y: s.avg ?? 0,
              })) as never,
              borderColor: color,
              backgroundColor: "transparent",
              borderWidth: 1,
              borderDash: [4, 3],
              pointRadius: 0,
              tension: 0.2,
            });
          }
        });
      }

      return { datasets };
    });

    const pingChartOptions = computed<ChartOptions<"line">>(() => {
      const annotations: Record<string, unknown> = {};
      const r = report.value;
      if (r) {
        let idx = 0;
        r.players.forEach((player) => {
          player.diagnostics.lagEvents.forEach((le) => {
            annotations[`lag-${idx}`] = {
              type: "line",
              xMin: new Date(le.timestamp).getTime(),
              xMax: new Date(le.timestamp).getTime(),
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
          player.diagnostics.connectionEvents.forEach((ce) => {
            annotations[`conn-${idx}`] = {
              type: "line",
              xMin: new Date(ce.timestamp).getTime(),
              xMax: new Date(ce.timestamp).getTime(),
              borderColor: ce.eventType === "Reconnect" ? "#ff9800" : "#f44336",
              borderWidth: 2,
              borderDash: [4, 2],
              label: {
                display: true,
                content: ce.eventType,
                position: "start",
                backgroundColor: ce.eventType === "Reconnect" ? "#ff9800" : "#f44336",
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
        plugins: {
          legend: { display: true, position: "bottom", labels: { usePointStyle: true, boxWidth: 8 } },
          annotation: { annotations },
        },
        scales: {
          x: { type: "time", time: { tooltipFormat: "HH:mm:ss", displayFormats: { second: "HH:mm:ss", minute: "HH:mm" } } },
          y: { beginAtZero: true, title: { display: true, text: "ms" } },
        },
        elements: { point: { radius: 0.5, hitRadius: 8 } },
      } as ChartOptions<"line">;
    });

    // ── Packet Loss chart ────────────────────────────────────────────
    const lossChartData = computed<ChartData<"bar">>(() => {
      const r = report.value;
      if (!r) return { labels: [], datasets: [] };

      const datasets: ChartData<"bar">["datasets"] = [];
      r.players.forEach((player, pi) => {
        if (!visiblePlayers[pi]) return;
        const color = PLAYER_COLORS[pi % PLAYER_COLORS.length];
        const lossPoints = player.diagnostics.pingHistory.filter((p) => p.lossRate > 0);
        if (lossPoints.length) {
          datasets.push({
            label: `${playerName(player.battleTag)} loss`,
            data: lossPoints.map((p) => ({
              x: new Date(p.timestamp).getTime(),
              y: p.lossRate * 100,
            })) as never,
            backgroundColor: color + "99",
            borderColor: color,
            borderWidth: 1,
          });
        }
      });

      return { datasets };
    });

    const lossChartOptions = computed<ChartOptions>(() => ({
      maintainAspectRatio: true,
      plugins: { legend: { display: true, position: "bottom", labels: { usePointStyle: true, boxWidth: 8 } } },
      scales: {
        x: { type: "time", time: { tooltipFormat: "HH:mm:ss", displayFormats: { second: "HH:mm:ss", minute: "HH:mm" } } },
        y: { beginAtZero: true, title: { display: true, text: "% loss" } },
      },
    }));

    // ── Summary Stats ────────────────────────────────────────────────
    const playerSummaries = computed(() => {
      const r = report.value;
      if (!r) return [];
      return r.players.map((player, pi) => {
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
          isProxied: player.connectionType === "Proxied",
          connectionLabel: player.connectionType === "Proxied"
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
      const events: { label: string; timestamp: string; playerIndex: number; eventIndex: number }[] = [];
      r.players.forEach((player, pi) => {
        player.diagnostics.lagEvents.forEach((le, ei) => {
          events.push({
            label: `!lag ${formatGameTime(le.gameTimeOffsetMs)} (${playerName(player.battleTag)})`,
            timestamp: le.timestamp,
            playerIndex: pi,
            eventIndex: ei,
          });
        });
        player.diagnostics.connectionEvents.forEach((ce, ei) => {
          events.push({
            label: `${ce.eventType} ${formatGameTime(ce.gameTimeOffsetMs)} (${playerName(player.battleTag)})`,
            timestamp: ce.timestamp,
            playerIndex: pi,
            eventIndex: ei,
          });
        });
      });
      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return events;
    });

    const selectedEvent = computed(() => {
      if (selectedEventIndex.value == null) return null;
      return inspectableEvents.value[selectedEventIndex.value] ?? null;
    });

    function findClosestTrace(player: LagReportPlayer, timestamp: string, direction: "forward" | "reverse"): HopData[] {
      const traces = direction === "forward" ? player.diagnostics.targetMtr : player.diagnostics.reverseMtr;
      if (!traces.length) return [];
      const ts = new Date(timestamp).getTime();
      let closest = traces[0];
      let minDiff = Math.abs(new Date(closest.timestamp).getTime() - ts);
      for (const t of traces) {
        const diff = Math.abs(new Date(t.timestamp).getTime() - ts);
        if (diff < minDiff) {
          closest = t;
          minDiff = diff;
        }
      }
      return closest.hops;
    }

    function findFirstTrace(player: LagReportPlayer, direction: "forward" | "reverse"): HopData[] {
      const traces = direction === "forward" ? player.diagnostics.targetMtr : player.diagnostics.reverseMtr;
      return traces.length ? traces[0].hops : [];
    }

    const baselineHops = computed<HopData[]>(() => {
      const r = report.value;
      if (!r || !selectedEvent.value) return [];
      const tab = inspectorPlayerTab.value;
      const isReverse = typeof tab === "string" && tab.startsWith("reverse-");
      const pi = isReverse ? parseInt(tab.toString().replace("reverse-", "")) : (tab as number);
      const player = r.players[pi];
      if (!player) return [];
      return findFirstTrace(player, isReverse ? "reverse" : "forward");
    });

    const selectedEventHops = computed<HopData[]>(() => {
      const r = report.value;
      const evt = selectedEvent.value;
      if (!r || !evt) return [];
      const tab = inspectorPlayerTab.value;
      const isReverse = typeof tab === "string" && tab.startsWith("reverse-");
      const pi = isReverse ? parseInt(tab.toString().replace("reverse-", "")) : (tab as number);
      const player = r.players[pi];
      if (!player) return [];
      return findClosestTrace(player, evt.timestamp, isReverse ? "reverse" : "forward");
    });

    const selectedEventAnnotation = computed<string | null>(() => {
      const evt = selectedEvent.value;
      if (!evt) return null;
      const r = report.value;
      if (!r) return null;
      const player = r.players[evt.playerIndex];
      if (!player) return null;
      const lagEvent = player.diagnostics.lagEvents[evt.eventIndex];
      return lagEvent?.annotation ?? null;
    });

    // ── Server Ping chart ────────────────────────────────────────────
    const serverPingChartData = computed<ChartData<"line">>(() => {
      const r = report.value;
      if (!r?.serverSidePing) return { datasets: [] };
      const gameStart = new Date(r.createdAt).getTime();
      const datasets: ChartData<"line">["datasets"] = [];

      r.serverSidePing.forEach((sp, si) => {
        const pi = r.players.findIndex((p) => p.battleTag === sp.playerName);
        const color = pi >= 0 ? PLAYER_COLORS[pi] : PLAYER_COLORS[si % PLAYER_COLORS.length];
        datasets.push({
          label: sp.playerName.split("#")[0],
          data: sp.samples.map((s) => ({
            x: gameStart + s.time * 1000,
            y: s.avg ?? 0,
          })) as never,
          borderColor: color,
          backgroundColor: "transparent",
          borderWidth: 1.5,
          pointRadius: 1,
          tension: 0.2,
        });
      });

      return { datasets };
    });

    const serverPingChartOptions: ChartOptions<"line"> = {
      maintainAspectRatio: true,
      plugins: { legend: { display: true, position: "bottom" } },
      scales: {
        x: { type: "time", time: { tooltipFormat: "HH:mm:ss" } },
        y: { beginAtZero: true, title: { display: true, text: "ms" } },
      },
    };

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
      selectedEventIndex,
      inspectorPlayerTab,
      visiblePlayers,
      playerColors,
      playerName,
      formatDate,
      formatGameTime,
      lastHopAvg,
      lastHopLoss,
      goBack,
      pingChartData,
      pingChartOptions,
      lossChartData,
      lossChartOptions,
      playerSummaries,
      inspectableEvents,
      selectedEvent,
      baselineHops,
      selectedEventHops,
      selectedEventAnnotation,
      serverPingChartData,
      serverPingChartOptions,
      mdiArrowLeft,
      mdiCircle,
    };
  },
});
</script>
