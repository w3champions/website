<template>
  <div class="past-downloads-tab px-4 py-4">
    <v-sheet class="history" border rounded="lg">
      <div class="history-header">
        <div>
          <div class="text-subtitle-1 font-weight-medium">{{ allUsers ? "Downloads of all users" : "Your past downloads" }}</div>
          <div class="text-body-2 text-medium-emphasis">
            <template v-if="allUsers && items.length > 0">
              {{ items.length.toLocaleString("en-US") }} downloads · {{ totalReplays.toLocaleString("en-US") }} replays ·
              {{ users.length }} {{ users.length === 1 ? "user" : "users" }} · {{ listValue }} at list price.
            </template>
            The server keeps no ZIP files. Download ZIP builds the ZIP again from the same games, at no cost.
          </div>
        </div>
        <div class="history-tools">
          <v-autocomplete
            v-if="allUsers"
            v-model="user"
            class="history-user"
            :items="users"
            :prepend-inner-icon="mdiAccountOutline"
            placeholder="All users"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          />
          <v-text-field
            v-model="search"
            class="history-search"
            :prepend-inner-icon="mdiMagnify"
            placeholder="Search"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          />
          <v-btn variant="text" :prepend-icon="mdiRefresh" :loading="loading" @click="refresh">
            Refresh
          </v-btn>
        </div>
      </div>

      <v-data-table
        :headers="headers"
        :items="shownItems"
        :search="search ?? ''"
        :custom-filter="matchesSearch"
        :loading="loading"
        item-value="id"
        density="compact"
        mobile-breakpoint="sm"
        :hide-default-header="display.xs.value"
        :items-per-page="25"
        :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
        class="history-table"
      >
        <!-- Phones: one compact card per download instead of one line per column. -->
        <template v-if="display.xs.value" v-slot:item="{ item }">
          <tr class="mobile-row">
            <td :colspan="headers.length">
              <div class="mobile-top">
                <div class="download-title" :class="{ 'text-medium-emphasis': !item.label }">{{ exportTitle(item) }}</div>
                <div v-if="item.price > 0" class="mobile-price">
                  <span class="price">{{ formatPrice(item.price, item.currency) }}</span>
                  <span v-if="!item.charged" class="text-caption text-medium-emphasis">free (admin)</span>
                </div>
              </div>
              <div v-if="item.description" class="download-description">{{ item.description }}</div>
              <div class="mobile-meta">
                {{ formatUtcMinute(item.createdAt) }} UTC<template v-if="allUsers"> · {{ item.requestedBy }}</template>
                · {{ item.count.toLocaleString("en-US") }} replays<template v-if="item.failed > 0">
                  ({{ item.failed.toLocaleString("en-US") }} missing)
                </template>
                · downloaded {{ item.downloadCount }}×
              </div>
              <v-btn
                class="mt-2"
                color="primary"
                variant="outlined"
                size="small"
                block
                :prepend-icon="mdiDownload"
                :loading="startingId === item.id"
                :disabled="startingId !== null"
                @click="downloadAgain(item.id)"
              >
                Download ZIP
              </v-btn>
            </td>
          </tr>
        </template>
        <template v-slot:[`item.createdAt`]="{ item }">
          <span class="text-no-wrap">{{ formatUtcMinute(item.createdAt) }}</span>
        </template>
        <template v-slot:[`item.requestedBy`]="{ item }">
          <span class="text-no-wrap">{{ item.requestedBy }}</span>
        </template>
        <template v-slot:[`item.title`]="{ item }">
          <div class="download-title" :class="{ 'text-medium-emphasis': !item.label }">{{ exportTitle(item) }}</div>
          <div v-if="item.description" class="download-description">{{ item.description }}</div>
        </template>
        <template v-slot:[`item.count`]="{ item }">
          <div class="text-no-wrap">{{ item.count.toLocaleString("en-US") }}</div>
          <div v-if="item.failed > 0" class="text-caption text-medium-emphasis text-no-wrap">
            {{ item.failed.toLocaleString("en-US") }} missing
          </div>
        </template>
        <template v-slot:[`item.price`]="{ item }">
          <template v-if="item.price > 0">
            <div class="text-no-wrap price">{{ formatPrice(item.price, item.currency) }}</div>
            <div v-if="!item.charged" class="text-caption text-medium-emphasis text-no-wrap">free (admin)</div>
          </template>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
        <template v-slot:[`item.downloadCount`]="{ item }">
          <div class="text-no-wrap">{{ item.downloadCount }}×</div>
          <div v-if="item.downloadCount > 1" class="text-caption text-medium-emphasis text-no-wrap">
            last {{ formatDay(item.lastDownloadedAt) }}<template v-if="allUsers && lastBy(item)"> by {{ lastBy(item) }}</template>
          </div>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <v-btn
            color="primary"
            variant="outlined"
            size="small"
            :prepend-icon="mdiDownload"
            :loading="startingId === item.id"
            :disabled="startingId !== null"
            @click="downloadAgain(item.id)"
          >
            Download ZIP
          </v-btn>
        </template>
        <template v-slot:no-data>
          <div class="empty py-8">
            <v-icon :icon="mdiHistory" size="36" class="mb-2" />
            <div class="text-subtitle-1">No downloads yet.</div>
            <div class="text-body-2 text-medium-emphasis">
              {{ user ? `${user} has no downloads.` : "A download shows here when its ZIP is complete." }}
            </div>
          </div>
        </template>
      </v-data-table>
    </v-sheet>

    <v-snackbar v-model="started" color="success" :timeout="8000">
      Download started: {{ startedCount.toLocaleString("en-US") }} replays, at no cost. The ZIP is built again while it
      streams.
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useDisplay } from "vuetify";
import { mdiAccountOutline, mdiDownload, mdiHistory, mdiMagnify, mdiRefresh } from "@mdi/js";
import { useReplayExportStore } from "@/store/admin/replayExport/store";
import { exportTitle, formatDay, formatUtcMinute } from "@/store/admin/replayExport/filters";
import { formatPrice } from "@/store/admin/replayExport/pricing";
import type { ReplayExportSummary } from "@/store/admin/replayExport/types";

/** `allUsers`: the admin view of everyone's downloads. Otherwise only the signed-in user's downloads. */
const props = defineProps<{ allUsers?: boolean }>();

const store = useReplayExportStore();
const display = useDisplay();

const search = ref<string | null>("");
const user = ref<string | null>(null);
const startingId = ref<string | null>(null);
const started = ref(false);
const startedCount = ref(0);

const items = computed(() => (props.allUsers ? store.allExports : store.exports));
const loading = computed(() => (props.allUsers ? store.allExportsLoading : store.exportsLoading));
const users = computed(() => [...new Set(items.value.map((e) => e.requestedBy))].sort((a, b) => a.localeCompare(b)));
const shownItems = computed(() => (user.value ? items.value.filter((e) => e.requestedBy === user.value) : items.value));
const totalReplays = computed(() => items.value.reduce((sum, e) => sum + e.count, 0));
/** What the downloads cost at list price; admins did not pay it. */
const listValue = computed(() => formatPrice(items.value.reduce((sum, e) => sum + e.price, 0), items.value[0]?.currency ?? "USD"));

const headers = computed(() => [
  { title: "Downloaded (UTC)", key: "createdAt", sortable: false, nowrap: true },
  ...(props.allUsers ? [{ title: "User", key: "requestedBy", sortable: false }] : []),
  { title: "Download", key: "title", sortable: false },
  { title: "Replays", key: "count", align: "end" as const, nowrap: true },
  { title: "Price", key: "price", align: "end" as const, nowrap: true },
  { title: "Times", key: "downloadCount", align: "end" as const, nowrap: true },
  { title: "", key: "actions", sortable: false, align: "end" as const },
]);

function refresh() {
  if (props.allUsers) store.loadAllExports();
  else store.loadExports();
}

function lastBy(item: ReplayExportSummary): string | undefined {
  return item.downloads.at(-1)?.by;
}

/** Searches the name, the selection line and the user of each download. */
function matchesSearch(_value: unknown, query: string, item?: { raw: ReplayExportSummary }): boolean {
  if (!item) return false;
  const text = `${exportTitle(item.raw)} ${item.raw.description ?? ""} ${item.raw.requestedBy}`.toLowerCase();
  return text.includes(query.trim().toLowerCase());
}

async function downloadAgain(exportId: string) {
  startingId.value = exportId;
  try {
    startedCount.value = await store.downloadAgain(exportId, props.allUsers);
    started.value = startedCount.value > 0;
  } finally {
    startingId.value = null;
  }
}

onMounted(refresh);
</script>

<style scoped>
.history {
  overflow: hidden;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.history-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  padding: 16px;
}

.history-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-search,
.history-user {
  width: 220px;
}

.history-table {
  background: transparent;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.history-table :deep(td) {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}

.price {
  font-variant-numeric: tabular-nums;
}

.download-title {
  font-weight: 600;
}

.download-description {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.mobile-row > td {
  display: block !important;
  height: auto !important;
  padding: 12px 16px !important;
}

.mobile-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.mobile-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex: 0 0 auto;
  line-height: 1.3;
  font-weight: 600;
}

.mobile-meta {
  margin-top: 4px;
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty .v-icon {
  opacity: 0.5;
}

@media (max-width: 599px) {
  .history-tools {
    width: 100%;
    flex-wrap: wrap;
  }

  .history-search,
  .history-user {
    flex: 1 1 100%;
  }
}
</style>
