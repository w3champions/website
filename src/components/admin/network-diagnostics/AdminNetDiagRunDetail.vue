<template>
  <div>
    <v-card-title class="pt-3 d-flex align-center flex-wrap ga-2">
      <v-btn icon variant="text" size="small" aria-label="Back to runs" :to="{ name: EAdminRouteName.NETDIAG_RUNS }">
        <v-icon>{{ mdiArrowLeft }}</v-icon>
      </v-btn>
      <span>Run</span>
      <code class="text-caption">{{ runId }}</code>
      <v-chip v-if="status" size="small" variant="tonal" :color="RUN_STATUS_COLOR[status]">{{ status }}</v-chip>
      <v-spacer />
      <v-btn variant="outlined" color="primary" :prepend-icon="mdiRefresh" :loading="store.runLoading" @click="load">Refresh</v-btn>
      <!-- v-show, not v-if: the dialog's activator must outlive the run turning Cancelled, or its leave transition loses its target. -->
      <v-btn v-show="status === 'Running'" ref="cancelButton" variant="outlined" color="error" :prepend-icon="mdiCancel" @click="cancelOpen = true">Cancel run</v-btn>
    </v-card-title>

    <v-container>
      <v-alert v-if="store.runError" type="error" variant="tonal" density="compact" class="mb-4">{{ store.runError }}</v-alert>
      <v-alert v-if="store.targetsError" type="error" variant="tonal" density="compact" class="mb-4">{{ store.targetsError }}</v-alert>
      <v-alert v-if="cancelError" type="error" variant="tonal" density="compact" class="mb-4">{{ cancelError }}</v-alert>
      <v-skeleton-loader v-if="!detail && store.runLoading" type="article, table" />

      <template v-if="detail">
        <v-card variant="outlined" class="mb-4">
          <v-card-text class="d-flex flex-wrap ga-4">
            <div><span class="text-medium-emphasis">Created:</span> <strong>{{ formatUtc(detail.run.createdAt) }}</strong> by <strong>{{ detail.run.createdBy }}</strong></div>
            <div><span class="text-medium-emphasis">Audience:</span> <strong>{{ audienceSummary(detail.run.audience) }}</strong></div>
            <div><span class="text-medium-emphasis">Targets:</span> <strong>{{ targetsSummary(detail.run.targets) }}</strong></div>
            <div><span class="text-medium-emphasis">Methods:</span> <strong>{{ detail.run.methods.join(", ") }}</strong></div>
            <div><span class="text-medium-emphasis">Window:</span> <strong>{{ detail.run.windowSeconds }} s</strong> <span class="text-medium-emphasis">(about {{ formatDuration(detail.run.expectedDurationSeconds) }} per player)</span></div>
            <div><span class="text-medium-emphasis">During games:</span> <strong>{{ detail.run.allowDuringGame ? "allowed" : "not allowed" }}</strong></div>
            <div v-if="detail.run.windowStart"><span class="text-medium-emphasis">Fleet window:</span> <strong>{{ formatUtc(detail.run.windowStart) }} – {{ formatUtc(detail.run.windowEnd) }}</strong></div>
            <div v-if="detail.run.cancelledAt"><span class="text-medium-emphasis">Cancelled:</span> <strong>{{ formatUtc(detail.run.cancelledAt) }}</strong></div>
          </v-card-text>
        </v-card>

        <v-row dense class="mb-4">
          <v-col v-for="tile in counterTiles(detail.run.counters)" :key="tile.label" cols="6" md="3">
            <v-card variant="tonal" :color="tile.color">
              <v-card-text>
                <div class="text-h5">{{ tile.value }}</div>
                <div class="text-caption">{{ tile.label }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <div class="d-flex align-center flex-wrap ga-2 mb-2">
          <h3 class="text-subtitle-1 font-weight-bold">Assignments</h3>
          <v-spacer />
          <v-btn size="small" variant="text" color="primary" :to="{ name: EAdminRouteName.NETDIAG_MEASUREMENTS, query: { runId } }">All results of this run</v-btn>
        </div>
        <v-data-table
          :headers="assignmentHeaders"
          :items="detail.assignments"
          :items-per-page="25"
          density="compact"
          item-value="measurementId"
          no-data-text="No players assigned yet."
        >
          <template v-slot:[`item.deliverAfter`]="{ item }">
            <router-link
              v-if="item.status === 'Submitted'"
              class="text-no-wrap"
              :to="{ name: EAdminRouteName.NETDIAG_MEASUREMENT_DETAIL, params: { measurementId: item.measurementId } }"
            >
              {{ formatUtc(item.deliverAfter) }}
            </router-link>
            <span v-else class="text-no-wrap">{{ formatUtc(item.deliverAfter) }}</span>
          </template>
          <template v-slot:[`item.battleTag`]="{ item }">
            <router-link :to="{ name: EAdminRouteName.NETDIAG_MEASUREMENTS, query: { battleTag: item.battleTag } }">{{ item.battleTag }}</router-link>
          </template>
          <template v-slot:[`item.status`]="{ item }">
            <v-chip size="x-small" variant="tonal" :color="ASSIGNMENT_STATUS_COLOR[item.status]">{{ item.status }}</v-chip>
          </template>
          <template v-slot:[`item.deliveredAt`]="{ item }">{{ formatUtc(item.deliveredAt) }}</template>
          <template v-slot:[`item.submittedAt`]="{ item }">{{ formatUtc(item.submittedAt) }}</template>
          <template v-slot:[`item.location`]="{ item }"><net-diag-cut-text :text="geoText(item.clientGeo)" /></template>
          <template v-slot:[`item.network`]="{ item }"><net-diag-cut-text :text="asnText(item.clientGeo?.asn, item.clientGeo?.asnOrg)" /></template>
          <template v-slot:[`item.actions`]="{ item }">
            <v-btn
              v-if="item.status === 'Submitted'"
              size="small"
              variant="text"
              color="primary"
              :to="{ name: EAdminRouteName.NETDIAG_MEASUREMENT_DETAIL, params: { measurementId: item.measurementId } }"
            >
              Result
            </v-btn>
          </template>
        </v-data-table>
        <net-diag-fleet-view
          v-if="detail.run.counters.submitted > 0"
          :key="detail.run.id"
          :run="detail.run"
          :targets="store.targets"
          :targets-loading="store.targetsLoading"
          class="mt-8"
        />
        <p v-else class="text-caption text-medium-emphasis mt-8">The fleet view appears once the first result is submitted.</p>
      </template>
    </v-container>

    <v-dialog v-model="cancelOpen" :activator="cancelButton ?? undefined" :open-on-click="false" max-width="480" :persistent="cancelling">
      <v-card>
        <v-card-title>Cancel this run?</v-card-title>
        <v-card-text>Pending players are not measured. Results already submitted are kept.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="cancelling" @click="cancelOpen = false">Keep running</v-btn>
          <v-btn color="error" variant="flat" :loading="cancelling" @click="cancelRun">Cancel run</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { type ComponentPublicInstance, computed, onBeforeUnmount, ref, watch } from "vue";
import type { DataTableHeader } from "vuetify";
import { mdiArrowLeft, mdiCancel, mdiRefresh } from "@mdi/js";
import { HttpError } from "@/services/http/AuthorizedClient";
import { EAdminRouteName } from "@/router/types";
import { formatUtc } from "@/helpers/utc-dates";
import { describeNetDiagError } from "@/store/admin/networkDiagnostics/errors";
import { useNetDiagRunsStore } from "@/store/admin/networkDiagnostics/runsStore";
import { asnText, ASSIGNMENT_STATUS_COLOR, audienceSummary, counterTiles, formatDuration, geoText, RUN_STATUS_COLOR, type RunStatus, runStatus, targetsSummary } from "./format";
import NetDiagCutText from "./NetDiagCutText.vue";
import NetDiagFleetView from "./NetDiagFleetView.vue";

const HTTP_CONFLICT = 409;

const props = defineProps<{ runId: string }>();
const store = useNetDiagRunsStore();

const now = ref(new Date());
const cancelOpen = ref(false);
const cancelling = ref(false);
const cancelError = ref("");
// The dialog opens from code; naming the button lets Vuetify hand the focus back to it on close.
const cancelButton = ref<ComponentPublicInstance | null>(null);
// Cleared on unmount: a cancel that settles after the page was left must write no state and load nothing.
let active = true;
onBeforeUnmount(() => {
  active = false;
});

// The store may still hold another run while this one loads; never show it.
const detail = computed(() => (store.runDetail?.run.id === props.runId ? store.runDetail : null));
const status = computed<RunStatus | null>(() => (detail.value ? runStatus(detail.value.run, now.value) : null));

const assignmentHeaders: DataTableHeader[] = [
  { title: "Slot", value: "deliverAfter", sortable: true },
  { title: "Player", value: "battleTag", sortable: true },
  { title: "Status", value: "status", sortable: true, width: "110px" },
  { title: "Delivered", value: "deliveredAt", sortable: true },
  { title: "Submitted", value: "submittedAt", sortable: true },
  { title: "Location", value: "location", sortable: false },
  { title: "Network", value: "network", sortable: false },
  { title: "Actions", value: "actions", sortable: false, width: "100px", align: "center" },
];

async function reloadRun(): Promise<void> {
  now.value = new Date();
  await store.loadRun(props.runId);
}

async function load(): Promise<void> {
  cancelError.value = "";
  // Node names for the fleet view's target selector; a no-op once loaded, a retry after a failure.
  void store.loadTargets();
  await reloadRun();
}

async function cancelRun(): Promise<void> {
  // Captured so a Back/Forward to another run mid-request cannot redirect or mis-attribute the outcome.
  const targetId = props.runId;
  const isCurrent = (): boolean => active && props.runId === targetId;
  cancelling.value = true;
  cancelError.value = "";
  let refresh = false;
  try {
    await store.cancelRun(targetId);
    refresh = true;
  } catch (e) {
    console.error("Failed to cancel network diagnostic run:", e);
    if (isCurrent()) cancelError.value = describeNetDiagError(e);
    // Already cancelled elsewhere: the page still reads Running until reloaded.
    refresh = e instanceof HttpError && e.status === HTTP_CONFLICT;
  } finally {
    if (isCurrent()) {
      cancelling.value = false;
      cancelOpen.value = false;
    }
  }
  // After the page was left (unmounted or moved to another run) the outcome must touch nothing.
  if (refresh && isCurrent()) await reloadRun();
}

// The component instance is reused across runs: never carry a dialog or its state over to another run.
watch(() => props.runId, () => {
  cancelOpen.value = false;
  cancelling.value = false;
  cancelError.value = "";
});
watch(() => props.runId, load, { immediate: true });
</script>
