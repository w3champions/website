<template>
  <v-container class="w3-container-width">
    <v-card>
      <v-card-title class="pt-3 d-flex align-center">
        Jobs
        <v-spacer />
        <v-btn variant="text" size="small" :loading="loading" @click="loadJobs">
          <v-icon start>{{ mdiRefresh }}</v-icon>
          Refresh
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-alert
          v-if="actionError"
          type="warning"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="actionError = ''"
        >
          {{ actionError }}
        </v-alert>

        <v-alert v-if="loadError" type="error" variant="tonal" class="mb-4">
          {{ loadError }}
        </v-alert>

        <div v-if="!loading && !loadError && jobs.length === 0" class="text-medium-emphasis py-4">
          No jobs are registered.
        </div>

        <v-card v-for="job in jobs" :key="job.key" variant="outlined" class="mb-3">
          <v-card-text>
            <div class="d-flex align-start flex-wrap ga-3">
              <!--
                min-width keeps a long description from squeezing the buttons onto
                their own line until the viewport is genuinely narrow; ms-auto keeps
                them right-aligned when it eventually does wrap.
              -->
              <div class="flex-grow-1" style="min-width: 320px; flex-basis: 0;">
                <div class="d-flex align-center ga-2 mb-1">
                  <span class="text-subtitle-1">{{ job.name }}</span>
                  <v-chip :color="statusColor(job.status)" size="small" variant="flat">
                    {{ job.status }}
                  </v-chip>
                </div>
                <div class="text-body-2 text-medium-emphasis">{{ job.description }}</div>
              </div>

              <div class="d-flex align-center ga-2 ms-auto flex-shrink-0">
                <v-btn
                  v-if="isRunning(job)"
                  color="warning"
                  variant="tonal"
                  :loading="busyKey === job.key"
                  @click="cancel(job)"
                >
                  <v-icon start>{{ mdiStop }}</v-icon>
                  Cancel
                </v-btn>
                <v-btn
                  v-else
                  color="primary"
                  :loading="busyKey === job.key"
                  @click="start(job, { force: needsForce(job) })"
                >
                  <v-icon start>{{ canResume(job) ? mdiPlayPause : mdiPlay }}</v-icon>
                  {{ runLabel(job) }}
                </v-btn>

                <v-menu v-if="!isRunning(job) && job.hasCheckpoint">
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon variant="plain" size="small">
                      <v-icon>{{ mdiDotsVertical }}</v-icon>
                    </v-btn>
                  </template>
                  <v-list density="compact">
                    <v-list-item
                      title="Start over"
                      subtitle="Discard the resume point"
                      @click="start(job, { force: true, reset: true })"
                    />
                  </v-list>
                </v-menu>
              </div>
            </div>

            <div v-if="isRunning(job) || job.progress.current > 0" class="mt-4">
              <v-progress-linear
                :model-value="percent(job)"
                :indeterminate="isRunning(job) && job.progress.total === 0"
                :color="isRunning(job) ? 'primary' : 'grey'"
                height="6"
                rounded
              />
              <div class="d-flex justify-space-between text-caption text-medium-emphasis mt-1">
                <span>{{ job.progress.message || "&nbsp;" }}</span>
                <span v-if="job.progress.total > 0">
                  {{ job.progress.current.toLocaleString() }} / {{ job.progress.total.toLocaleString() }}
                </span>
              </div>
            </div>

            <!--
              Interrupted and Cancelled carry an explanation in the same field as a
              real failure, but neither is one - a deploy or a deliberate stop should
              not read as red.
            -->
            <v-alert
              v-if="job.error"
              :type="job.status === 'Failed' ? 'error' : 'warning'"
              variant="tonal"
              density="compact"
              class="mt-3"
            >
              {{ job.error }}
            </v-alert>

            <div v-if="job.runCount > 0" class="text-caption text-medium-emphasis mt-3">
              <span v-if="job.finishedAt">{{ job.status === "Completed" ? "Finished" : "Stopped" }}
                {{ formatDate(job.finishedAt) }}</span>
              <span v-else-if="job.startedAt">Started {{ formatDate(job.startedAt) }}</span>
              <span v-if="job.durationMs"> &middot; ran for {{ formatDuration(job.durationMs) }}</span>
              <span v-if="job.itemsProcessed > 0"> &middot; {{ job.itemsProcessed.toLocaleString() }} items</span>
              <span v-if="job.triggeredBy"> &middot; by {{ job.triggeredBy }}</span>
              <span v-if="canResume(job)" class="text-warning"> &middot; will resume where it stopped</span>
            </div>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>

    <v-dialog v-model="confirmOpen" max-width="520px">
      <v-card v-if="pending">
        <v-card-title class="pt-3">Run {{ pending.job.name }}?</v-card-title>
        <v-card-text>
          <p class="mb-3">{{ pending.job.description }}</p>
          <v-alert v-if="pending.reset" type="warning" variant="tonal" density="compact" class="mb-3">
            This discards the resume point, so the job starts from the beginning.
          </v-alert>
          <p class="mb-2 text-body-2">Type <strong>{{ pending.job.name }}</strong> to confirm.</p>
          <v-text-field
            v-model="typedName"
            variant="underlined"
            color="primary"
            autofocus
            @keyup.enter="confirmed && runPending()"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmOpen = false">Cancel</v-btn>
          <v-btn color="primary" :disabled="!confirmed" @click="runPending">Run</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from "vue";
import { mdiDotsVertical, mdiPlay, mdiPlayPause, mdiRefresh, mdiStop } from "@mdi/js";
import { useOauthStore } from "@/store/oauth/store";
import { API_URL } from "@/config/env";
import { AdminJobService } from "@/services/admin/AdminJobService";
import { HttpError } from "@/services/http/AuthorizedClient";
import { AdminJob, canResume, EAdminJobStatus, isRunning, needsForce } from "@/types/admin/AdminJob";

/** Poll fast enough for a progress bar to look live, slowly when nothing moves. */
const POLL_WHILE_RUNNING_MS = 2000;
const POLL_WHEN_IDLE_MS = 15000;

// Built lazily for the same reason the service takes its endpoint: API_URL reads
// window at module load.
let _service: AdminJobService | null = null;
function getService(): AdminJobService {
  return _service ??= new AdminJobService({ endpoint: API_URL });
}

export default defineComponent({
  name: "AdminJobs",
  setup() {
    const oauthStore = useOauthStore();
    const token = computed(() => oauthStore.token);

    const jobs = ref<AdminJob[]>([]);
    const loading = ref(false);
    const busyKey = ref("");
    const actionError = ref("");
    const loadError = ref("");

    const confirmOpen = ref(false);
    const typedName = ref("");
    const pending = ref<{ job: AdminJob; force: boolean; reset: boolean } | null>(null);
    const confirmed = computed(() => typedName.value.trim() === pending.value?.job.name);

    let pollTimer: number | undefined;

    async function loadJobs() {
      loading.value = true;
      try {
        jobs.value = await getService().getJobs(token.value);
        loadError.value = "";
      } catch (error) {
        // Say so rather than leaving an empty list looking like "no jobs exist",
        // and keep whatever was last loaded so a blip mid-run doesn't blank the
        // page.
        console.error("Failed to load jobs:", error);
        loadError.value = error instanceof HttpError && error.status === 403
          ? "You don't have permission to view jobs."
          : "Could not load jobs.";
      } finally {
        loading.value = false;
      }
    }

    async function poll() {
      await loadJobs();
      scheduleNextPoll();
    }

    function scheduleNextPoll() {
      window.clearTimeout(pollTimer);
      const delay = jobs.value.some(isRunning) ? POLL_WHILE_RUNNING_MS : POLL_WHEN_IDLE_MS;
      pollTimer = window.setTimeout(() => void poll(), delay);
    }

    function start(job: AdminJob, { force = false, reset = false } = {}) {
      // Resetting throws away progress, so it is confirmed even for a job that
      // does not otherwise ask.
      if (job.requiresConfirmation || reset) {
        pending.value = { job, force, reset };
        typedName.value = "";
        confirmOpen.value = true;
        return;
      }

      void run(job, force, reset);
    }

    function runPending() {
      if (!pending.value || !confirmed.value) return;

      const { job, force, reset } = pending.value;
      confirmOpen.value = false;
      void run(job, force, reset);
    }

    async function run(job: AdminJob, force: boolean, reset: boolean) {
      busyKey.value = job.key;
      actionError.value = "";
      try {
        const result = await getService().runJob(job.key, token.value, { force, reset });
        if (!result.ok) {
          actionError.value = result.message;
        }
      } finally {
        busyKey.value = "";
        // Either way the server is the authority on what the job is now doing.
        await loadJobs();
        scheduleNextPoll();
      }
    }

    async function cancel(job: AdminJob) {
      busyKey.value = job.key;
      actionError.value = "";
      try {
        const result = await getService().cancelJob(job.key, token.value);
        if (!result.ok) {
          actionError.value = result.message;
        }
      } finally {
        busyKey.value = "";
        // Cancellation is cooperative, so the job is still winding down here and
        // the terminal status arrives on a later poll.
        await loadJobs();
        scheduleNextPoll();
      }
    }

    function runLabel(job: AdminJob): string {
      if (canResume(job)) return "Resume";
      return needsForce(job) ? "Run again" : "Run";
    }

    function statusColor(status: EAdminJobStatus): string {
      switch (status) {
        case EAdminJobStatus.Running: return "primary";
        case EAdminJobStatus.Completed: return "success";
        case EAdminJobStatus.Failed: return "error";
        case EAdminJobStatus.Cancelled:
        case EAdminJobStatus.Interrupted: return "warning";
        default: return "grey";
      }
    }

    function percent(job: AdminJob): number {
      return job.progress.total > 0 ? (job.progress.current / job.progress.total) * 100 : 0;
    }

    function formatDate(value: string): string {
      return new Date(value).toLocaleString();
    }

    function formatDuration(ms: number): string {
      const seconds = Math.round(ms / 1000);
      if (seconds < 60) return `${seconds}s`;

      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ${seconds % 60}s`;

      return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    }

    onMounted(async () => {
      await loadJobs();
      scheduleNextPoll();
    });

    onUnmounted(() => window.clearTimeout(pollTimer));

    return {
      jobs,
      loading,
      busyKey,
      actionError,
      loadError,
      confirmOpen,
      typedName,
      pending,
      confirmed,
      loadJobs,
      start,
      runPending,
      cancel,
      runLabel,
      statusColor,
      percent,
      formatDate,
      formatDuration,
      isRunning,
      canResume,
      needsForce,
      mdiDotsVertical,
      mdiPlay,
      mdiPlayPause,
      mdiRefresh,
      mdiStop,
    };
  },
});
</script>
