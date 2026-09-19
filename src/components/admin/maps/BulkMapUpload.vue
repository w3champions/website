<template>
  <v-card>
    <v-card-title>
      <span class="text-h5">Bulk Map Upload</span>
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-alert v-if="error" type="error" closable class="mb-4" @update:model-value="error = ''">
          {{ error }}
        </v-alert>

        <v-alert v-if="successMessage" type="success" closable class="mb-4" @update:model-value="successMessage = ''">
          {{ successMessage }}
        </v-alert>

        <v-alert type="info" variant="outlined" class="mb-4">
          <div class="text-subtitle-2 mb-2">Instructions:</div>
          <ul class="ml-4">
            <li>Select multiple .w3m or .w3x files</li>
            <li>Filenames must be in format: <code>{map_id}_{name}.w3m</code> or <code>{map_id}_{name}.w3x</code></li>
            <li>Example: <code>5529_twisted_meadows.w3m</code> (map_id = 5529)</li>
            <li>Maps with the specified IDs must already exist in the system</li>
            <li>
              Picking the same map from several mode folders is fine: identical copies are uploaded once, and a
              file that is already stored is reused instead of uploaded again.
            </li>
          </ul>
        </v-alert>

        <map-file-drop-zone
          v-model="files"
          multiple
          :disabled="busy"
          label="Drag & drop map files here"
        />

        <v-alert v-if="duplicateMapIds.length" type="warning" variant="outlined" class="mt-4">
          {{ duplicateMapIds.length }} map{{ duplicateMapIds.length === 1 ? " is" : "s are" }} targeted by more
          than one file ({{ duplicateMapIds.join(", ") }}). All of them upload, but only the last one selected
          stays active for that map.
        </v-alert>

        <v-row class="mt-2">
          <v-col class="d-flex flex-wrap ga-2">
            <v-btn
              color="primary"
              class="text-w3-race-bg"
              :disabled="readyRows.length === 0 || busy"
              :loading="runningAction === 'upload'"
              @click="runUpload"
            >
              Upload ({{ readyRows.length }})
            </v-btn>
            <!-- Outlined rather than filled: a disabled filled button renders as a
                 pale block on the dark themes. -->
            <v-btn
              variant="outlined"
              :disabled="readyRows.length === 0 || busy"
              :loading="runningAction === 'upload-select'"
              @click="runUploadAndSelect"
            >
              Upload &amp; select
            </v-btn>
            <v-btn
              color="success"
              class="text-w3-race-bg"
              :disabled="selectableRows.length === 0 || busy"
              :loading="runningAction === 'select'"
              @click="runSelect"
            >
              Select uploaded ({{ selectableRows.length }})
            </v-btn>
            <!-- Held back for the whole run, not just for the request in flight: a
                 run keeps writing through phases where nothing is on screen. It
                 stays available during the pre-flight check, which writes nothing. -->
            <v-btn
              class="bg-error text-w3-race-bg"
              :disabled="!gating.canReset"
              variant="text"
              @click="reset"
            >
              Reset
            </v-btn>
          </v-col>
        </v-row>

        <div v-if="preparing" class="text-caption text-medium-emphasis mt-3">
          Checking the picked files against what is already stored…
        </div>

        <div v-if="uploading" class="mt-3">
          <v-progress-linear
            :model-value="currentRowPercent"
            :indeterminate="currentRowPercent >= 100"
            color="primary"
            height="8"
            rounded
          />
          <div class="text-caption text-medium-emphasis mt-1">
            Uploading file {{ uploadIndex }} of {{ uploadTotal }}: {{ uploadingFileName }}
            {{ currentRowPercent >= 100 ? "— processing on the server…" : `— ${currentRowPercent}%` }}
          </div>
        </div>

        <template v-if="rows.length > 0">
          <v-divider class="my-4" />

          <div class="d-flex align-center flex-wrap ga-2 mb-3">
            <div class="text-h6 mr-2">Detected maps ({{ rows.length }})</div>
            <v-chip v-if="readyRows.length" color="info" size="small" variant="flat">
              {{ readyRows.length }} ready
            </v-chip>
            <v-chip v-if="duplicateRows.length" color="warning" size="small" variant="flat">
              {{ duplicateRows.length }} identical duplicate{{ duplicateRows.length === 1 ? "" : "s" }}
            </v-chip>
            <v-chip v-if="skippedRows.length" color="warning" size="small" variant="flat">
              {{ skippedRows.length }} skipped
            </v-chip>
            <v-chip v-if="uploadedRows.length" color="warning" size="small" variant="flat">
              {{ uploadedRows.length }} uploaded, not selected
            </v-chip>
            <v-chip v-if="selectedRows.length" color="success" size="small" variant="flat">
              {{ selectedRows.length }} selected
            </v-chip>
            <v-chip v-if="problemRows.length" color="error" size="small" variant="flat">
              {{ problemRows.length }} need attention
            </v-chip>
          </div>

          <!-- One block per file rather than a table: with the map, the file it
               replaces and an editable target name, the columns grew wider than
               the dialog. -->
          <v-card v-for="row in rows" :key="row.key" variant="outlined" class="pa-3 mb-3">
            <div class="d-flex flex-wrap align-center ga-2">
              <span class="font-weight-medium text-break">{{ row.fileName }}</span>
              <v-spacer />
              <v-chip
                :color="statusColor(statusOf(row))"
                variant="flat"
                size="small"
                :prepend-icon="statusIcon(statusOf(row))"
              >
                {{ statusLabel(statusOf(row)) }}
              </v-chip>
            </div>

            <v-progress-linear
              v-if="statusOf(row) === 'uploading'"
              :model-value="row.percent"
              :indeterminate="row.percent >= 100"
              color="primary"
              height="4"
              rounded
              class="mt-2"
            />

            <v-row dense class="mt-1">
              <v-col cols="12" md="6">
                <!-- Rows we could not match are fixable in place: pick the map here
                     instead of renaming the file and dropping it again. -->
                <v-autocomplete
                  v-if="isFixable(row)"
                  :model-value="row.map ? row.mapId : null"
                  :items="mapOptions"
                  item-title="title"
                  item-value="value"
                  label="Pick a map"
                  density="compact"
                  variant="underlined"
                  color="primary"
                  hide-details
                  :disabled="busy"
                  @update:model-value="assignMap(row, $event)"
                />
                <div v-else class="d-flex flex-wrap align-center ga-2 text-body-2">
                  <span class="text-medium-emphasis">Map</span>
                  <span class="font-weight-medium">{{ row.map?.name }}</span>
                  <span class="text-medium-emphasis">({{ row.mapId }})</span>
                  <v-chip v-if="row.map?.category" size="x-small" variant="tonal">
                    {{ row.map.category }}
                  </v-chip>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <!-- A rename is also the retry: a file rejected because the name is
                     taken by another map's file can only be fixed here. -->
                <v-text-field
                  :model-value="row.storeAs"
                  label="Store the file as"
                  density="compact"
                  variant="underlined"
                  color="primary"
                  hide-details
                  :disabled="busy || !canRename(row)"
                  @update:model-value="renameRow(row, $event)"
                />
              </v-col>
            </v-row>

            <div class="text-caption text-medium-emphasis mt-2">
              <template v-if="row.currentFileName">Current file: {{ row.currentFileName }}</template>
              <template v-else>This map has no file yet</template>
            </div>

            <div
              v-if="row.mapId !== null && duplicateMapIds.includes(row.mapId)"
              class="text-caption text-warning mt-1"
            >
              <v-icon size="x-small" class="mr-1">{{ mdiAlertOutline }}</v-icon>
              Another file in this batch targets the same map.
            </div>

            <div v-if="messageOf(row)" class="text-caption text-medium-emphasis mt-1">
              {{ messageOf(row) }}
            </div>
          </v-card>
        </template>
      </v-container>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <!-- Closing unmounts this component, so it is held back for the whole run -
           the writes would carry on with nowhere to report to. -->
      <v-btn :disabled="!gating.canClose" variant="text" class="bg-primary text-w3-race-bg" @click="cancel">
        Close
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import { useMapsManagementStore } from "@/store/admin/mapsManagement/store";
import { Map, MapFileData } from "@/store/admin/mapsManagement/types";
import { mdiAlertCircleOutline, mdiAlertOutline, mdiCheckCircle, mdiCloudCheckOutline, mdiContentCopy, mdiFileQuestionOutline, mdiMinusCircleOutline, mdiProgressClock, mdiProgressUpload } from "@mdi/js";
import MapFileDropZone from "./MapFileDropZone.vue";
import { mapFileName, toStoredFileName } from "./mapFilePath";
import { BulkPlanEntry, planBulkUpload, StoredMapFilesByMapId } from "./bulkUploadPlan";
import { BulkSelectItem, BulkUploadItem, reconcileFailedUpload, selectMapFiles, uploadMapFiles } from "./bulkUploadRunner";
import {
  BulkRowState,
  BulkRowStatus,
  gatingFor,
  RunAction,
  RunTally,
  startTally,
  summarizeRun,
  toPlanCandidates,
} from "./bulkUploadUi";
import { sha1Hex } from "./mapFileHash";

// What has happened to a row so far. What it *should* do next is not stored here:
// bulkUploadPlan decides that from the picked files and the stored ones, so it
// stays correct while the operator edits a target name or retries a failed row.
type RowState = BulkRowState;

type RowStatus = BulkRowStatus;

interface BulkRow {
  // Unique per picked file: two files with the same name must never share a row.
  key: string;
  file: File;
  fileName: string;
  mapId: number | null;
  map?: Map;
  currentFileName: string;
  // What the file will be stored as; starts as its own name and is editable.
  storeAs: string;
  state: RowState;
  message?: string;
  percent: number;
  // Hex SHA-1 of the whole file, which is what the update service stores too.
  sha1: string | null;
  mapFile?: MapFileData;
}

export default defineComponent({
  name: "BulkMapUpload",
  components: { MapFileDropZone },
  setup(props, context) {
    const mapsManagementStore = useMapsManagementStore();
    const files = ref<File[]>([]);
    const rows = ref<BulkRow[]>([]);
    const uploading = ref<boolean>(false);
    const lookupsInFlight = ref<number>(0);
    // Rows currently being hashed and maps currently being read, so two
    // overlapping drops do not do the same work twice.
    const hashingKeys = new Set<string>();
    const lookupKeys = new Set<number>();
    // Bumped by Reset, so a lookup that was already in flight cannot write its
    // answer into the next batch.
    let storedGeneration = 0;
    const error = ref<string>("");
    const successMessage = ref<string>("");
    // Which button is running, so only that one shows a spinner - and, because it
    // spans the whole run rather than one request, what gates Reset and Close.
    const runningAction = ref<RunAction>(null);
    const uploadIndex = ref<number>(0);
    const uploadTotal = ref<number>(0);
    const uploadingFileName = ref<string>("");
    const currentRowPercent = ref<number>(0);
    // Each target map's stored files, or null when the lookup failed. The plan
    // refuses to guess rather than uploading into an unknown state.
    const storedFiles = ref<StoredMapFilesByMapId>({});
    let nextRowKey = 0;

    // Derived from the rows themselves rather than from a "hashing" flag, so a
    // second drop that lands mid-hash cannot clear it early and make the plan
    // call a file that has simply not been hashed yet unreadable.
    const preparing = computed<boolean>(() =>
      lookupsInFlight.value > 0
      || rows.value.some((row) => row.state === "pending" && row.sha1 === null && !row.message)
    );
    const gating = computed(() => gatingFor({ runningAction: runningAction.value, preparing: preparing.value }));
    const busy = computed<boolean>(() => gating.value.busy);

    // Disabling Close is not enough on its own: the dialog around this component
    // also closes on Escape and on a click outside, which unmounts it while the
    // run keeps writing. Tell the parent when it has to hold the dialog open.
    watch(() => !gating.value.canClose, (running) => context.emit("running", running), { immediate: true });

    // The plan is recomputed from the rows, so editing a target name immediately
    // moves a file between "ready", "already stored" and "needs attention".
    //
    // Rows that are already on their way keep their place in the plan - a file
    // being uploaded still claims its name, so its identical copies stay
    // duplicates. A row that failed is left out, so one of its copies can take
    // over on the next attempt instead of the map ending up with no file at all.
    const planByKey = computed<Record<string, BulkPlanEntry>>(() => {
      if (preparing.value) return {};

      const candidates = toPlanCandidates(
        rows.value.map((row) => ({
          key: row.key,
          fileName: row.fileName,
          storeAs: row.storeAs,
          mapId: row.mapId,
          mapExists: !!row.map,
          sha1: row.sha1,
          state: row.state,
        })),
      );

      const entries: Record<string, BulkPlanEntry> = {};
      for (const entry of planBulkUpload(candidates, storedFiles.value)) entries[entry.key] = entry;
      return entries;
    });

    function planOf(row: BulkRow): BulkPlanEntry | undefined {
      return row.state === "pending" ? planByKey.value[row.key] : undefined;
    }

    function statusOf(row: BulkRow): RowStatus {
      switch (row.state) {
        case "uploading": return "uploading";
        case "uploaded": return "uploaded";
        case "selected": return "selected";
        case "failed": return "error";
      }

      const plan = planOf(row);
      if (!plan) return "preparing";
      switch (plan.action) {
        case "upload": return "ready";
        case "reuse": return "reuse";
        case "duplicate": return "duplicate";
        case "skip": return "skipped";
        default: return "error";
      }
    }

    function messageOf(row: BulkRow): string | undefined {
      if (row.message) return row.message;

      const plan = planOf(row);
      if (!plan?.duplicateOf) return plan?.message;

      // Two copies share a name, so naming the file it duplicates is not enough
      // to tell them apart: point at its position in the batch.
      const position = rows.value.findIndex((candidate) => candidate.key === plan.duplicateOf);
      return position < 0 ? plan.message : `${plan.message} (file ${position + 1} in this batch)`;
    }

    function rowsWithStatus(status: RowStatus): BulkRow[] {
      return rows.value.filter((row) => statusOf(row) === status);
    }

    // "Ready" covers both a real upload and reusing an identical stored file:
    // either way the map ends up pointing at the right file.
    const readyRows = computed<BulkRow[]>(() =>
      rows.value.filter((row) => ["ready", "reuse"].includes(statusOf(row)))
    );
    const duplicateRows = computed<BulkRow[]>(() => rowsWithStatus("duplicate"));
    const skippedRows = computed<BulkRow[]>(() => rowsWithStatus("skipped"));
    const uploadedRows = computed<BulkRow[]>(() => rowsWithStatus("uploaded"));
    // A row whose map update failed still has its uploaded file, so "Select
    // uploaded" is also the retry for it - otherwise the only way back is a
    // Reset that throws away the whole batch.
    const selectableRows = computed<BulkRow[]>(() =>
      rows.value.filter((row) =>
        !!row.map && !!row.mapFile && (row.state === "uploaded" || row.state === "failed")
      )
    );
    const selectedRows = computed<BulkRow[]>(() => rowsWithStatus("selected"));
    // Both a failed request and a file the plan refused to send count here, so a
    // run can never be summed up as a success while one of them is on screen.
    const problemRows = computed<BulkRow[]>(() => rowsWithStatus("error"));

    // Two files aimed at the same map both upload fine, but only the last one
    // selected stays active - worth flagging before the admin walks away.
    // Identical copies are excluded: they are handled once, not twice.
    const duplicateMapIds = computed<number[]>(() => {
      // Note: `Map` is the imported map type here, not the JS global.
      const counts: Record<number, number> = {};
      for (const row of rows.value) {
        if (row.mapId === null || ["duplicate", "skipped", "error"].includes(statusOf(row))) continue;
        counts[row.mapId] = (counts[row.mapId] ?? 0) + 1;
      }
      return Object.keys(counts).map(Number).filter((mapId) => counts[mapId] > 1);
    });

    const mapOptions = computed(() =>
      [...mapsManagementStore.maps]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((map) => ({ title: `${map.name} (${map.id})`, value: map.id }))
    );

    async function loadStoredFiles(mapId: number, force = false): Promise<void> {
      if (!force && (mapId in storedFiles.value || lookupKeys.has(mapId))) return;

      const generation = storedGeneration;
      lookupKeys.add(mapId);
      lookupsInFlight.value++;
      try {
        const mapFiles = await mapsManagementStore.fetchMapFiles(mapId);
        // Reset while this was in flight: the answer belongs to a batch that is gone.
        if (generation === storedGeneration) storedFiles.value[mapId] = mapFiles;
      } catch {
        // Null, not an empty list: "no files" and "we could not find out" lead to
        // very different decisions.
        if (generation === storedGeneration) storedFiles.value[mapId] = null;
      } finally {
        // Both the claim and the counter belong to the batch this lookup started
        // in. A Reset has already cleared them, and touching them now would undo
        // a claim the new batch is relying on.
        if (generation === storedGeneration) {
          lookupKeys.delete(mapId);
          lookupsInFlight.value--;
        }
      }
    }

    async function hashPickedFiles(): Promise<void> {
      // Claim the rows synchronously, before the first await, so an overlapping
      // call cannot pick up the same ones.
      const unhashed = rows.value.filter(
        (row) => row.sha1 === null && !row.message && !hashingKeys.has(row.key)
      );
      for (const row of unhashed) hashingKeys.add(row.key);

      try {
        for (const row of unhashed) {
          try {
            row.sha1 = await sha1Hex(row.file);
          } catch (err) {
            row.message = err instanceof Error ? err.message : "The file could not be read.";
          }
        }
      } finally {
        for (const row of unhashed) hashingKeys.delete(row.key);
      }
    }

    async function prepareRows(): Promise<void> {
      const mapIds = [...new Set(rows.value.map((row) => row.mapId).filter((id): id is number => id !== null))];
      await Promise.all([hashPickedFiles(), ...mapIds.map((mapId) => loadStoredFiles(mapId))]);
    }

    function isFixable(row: BulkRow): boolean {
      return statusOf(row) === "skipped";
    }

    // A file that failed before anything was stored for it can be renamed and
    // tried again - the name may be held by a file of a different map, which this
    // map's own file list cannot show.
    function canRename(row: BulkRow): boolean {
      return row.state === "pending" || (row.state === "failed" && !row.mapFile);
    }

    function renameRow(row: BulkRow, storeAs: string): void {
      row.storeAs = storeAs;
      if (row.state !== "failed") return;

      // Renaming is the retry: put the row back in front of the planner, which
      // does not look at failed rows.
      row.state = "pending";
      row.message = undefined;
    }

    function assignMap(row: BulkRow, mapId: number | null): void {
      const map = mapsManagementStore.maps.find((m) => m.id === mapId);
      if (!map) return;

      row.mapId = map.id;
      row.map = map;
      row.currentFileName = mapFileName(map.gameMap?.path);
      row.message = undefined;
      // The row may never have been hashed (a file that could not be read keeps
      // its reason in `message`, which was just cleared), so prepare it again
      // rather than leaving it waiting for a hash that no one will compute.
      void prepareRows();
    }

    function extractMapIdFromFilename(filename: string): number | null {
      // Extract map ID from format: {map_id}_{name}.w3m or {map_id}_{name}.w3x
      const match = filename.match(/^(\d+)_/);
      if (match) {
        return parseInt(match[1], 10);
      }
      return null;
    }

    // Detection runs as soon as files are picked, so the map each file targets and
    // what will happen to it are visible before anything is uploaded.
    function detectRow(file: File): BulkRow {
      const mapId = extractMapIdFromFilename(file.name);
      const map = mapId === null ? undefined : mapsManagementStore.maps.find((m) => m.id === mapId);
      return {
        key: `row-${nextRowKey++}`,
        file,
        fileName: file.name,
        mapId,
        map,
        currentFileName: mapFileName(map?.gameMap?.path),
        storeAs: file.name,
        percent: 0,
        state: "pending",
        sha1: null,
      };
    }

    // Re-detect whenever the picked files change, but keep the rows whose file is
    // already known so their hash and their outcome are not lost.
    watch(files, (newFiles) => {
      rows.value = newFiles.map((file) => rows.value.find((row) => row.file === file) ?? detectRow(file));
      void prepareRows();
    }, { deep: true });

    function statusLabel(status: RowStatus): string {
      switch (status) {
        case "preparing": return "Checking";
        case "ready": return "Ready";
        case "reuse": return "Already stored";
        case "duplicate": return "Duplicate, skipped";
        case "skipped": return "Skipped";
        case "uploading": return "Uploading";
        case "uploaded": return "Uploaded";
        case "selected": return "Selected";
        default: return "Needs attention";
      }
    }

    function statusColor(status: RowStatus): string {
      switch (status) {
        case "preparing": return "info";
        case "ready": return "info";
        case "reuse": return "info";
        case "uploading": return "info";
        case "duplicate": return "warning";
        case "skipped": return "warning";
        case "uploaded": return "warning";
        case "selected": return "success";
        default: return "error";
      }
    }

    function statusIcon(status: RowStatus): string {
      switch (status) {
        case "preparing": return mdiProgressClock;
        case "ready": return mdiFileQuestionOutline;
        case "reuse": return mdiCloudCheckOutline;
        case "uploading": return mdiProgressUpload;
        case "duplicate": return mdiContentCopy;
        case "skipped": return mdiMinusCircleOutline;
        case "uploaded": return mdiCloudCheckOutline;
        case "selected": return mdiCheckCircle;
        default: return mdiAlertCircleOutline;
      }
    }

    function rowByKey(key: string): BulkRow | undefined {
      return rows.value.find((row) => row.key === key);
    }

    // Uploads stay sequential: batches are small and one file at a time keeps the
    // progress readable and the server load predictable.
    async function uploadFiles(tally: RunTally): Promise<number> {
      const plan = planByKey.value;
      const items: BulkUploadItem[] = readyRows.value.map((row) => ({
        key: row.key,
        mapId: row.mapId as number,
        fileName: row.fileName,
        // Only the name, never a path: the plan claims the same string.
        storeAs: toStoredFileName(row.storeAs, row.fileName),
        sha1: row.sha1 as string,
        file: row.file,
        reuseMapFile: plan[row.key]?.reuseMapFile,
      }));

      if (items.length === 0) {
        error.value = "No files ready to upload.";
        return 0;
      }

      uploading.value = true;
      uploadIndex.value = 0;
      uploadTotal.value = items.length;

      let results: Awaited<ReturnType<typeof uploadMapFiles>> = [];
      try {
        results = await uploadMapFiles(items, {
          uploadFile: (item, onProgress) => {
            const formData = new FormData();
            formData.append("mapId", String(item.mapId));
            formData.append("mapFile", item.file, item.fileName);
            // An untouched name means "no override", which is the empty string the
            // backend already treats as "use the uploaded file's own name".
            formData.append("fileName", item.storeAs === item.fileName ? "" : item.storeAs);
            return mapsManagementStore.createMapFile(formData, onProgress);
          },
          fetchMapFiles: (mapId) => mapsManagementStore.fetchMapFiles(mapId),
        }, {
          onStart: (item, index) => {
            const row = rowByKey(item.key);
            if (row) {
              row.state = "uploading";
              row.message = undefined;
              row.percent = 0;
              uploadingFileName.value = row.fileName;
            }
            uploadIndex.value = index + 1;
            currentRowPercent.value = 0;
          },
          onProgress: (item, percent) => {
            const row = rowByKey(item.key);
            if (row) row.percent = percent;
            currentRowPercent.value = percent;
          },
        });

        for (const result of results) {
          const row = rowByKey(result.key);
          if (!row) continue;
          row.state = result.ok ? "uploaded" : "failed";
          row.mapFile = result.mapFile;
          row.message = result.message
            ?? (result.reused ? "The identical file was already stored, so it was not uploaded again." : undefined);
        }
      } finally {
        uploading.value = false;
        uploadingFileName.value = "";
        currentRowPercent.value = 0;
      }

      // The uploads told us what was stored, so the local list is updated from the
      // records themselves instead of re-reading every map that was written to.
      // Only a map whose upload failed is in an uncertain state and re-read.
      const uncertain = new Set<number>();
      for (const result of results) {
        const mapId = rowByKey(result.key)?.mapId;
        if (mapId === null || mapId === undefined) continue;

        const stored = storedFiles.value[mapId];
        if (!result.ok || !result.mapFile) uncertain.add(mapId);
        else if (!result.reused && stored) storedFiles.value[mapId] = [...stored, result.mapFile];
        else if (!result.reused) uncertain.add(mapId);
      }
      await Promise.all([...uncertain].map((mapId) => loadStoredFiles(mapId, true)));

      // A failed upload may well have been stored - a timeout is the clearest
      // case - and a bare failed row is a dead end: the planner is not shown
      // failed rows and "Select uploaded" needs a record, so neither button can
      // act on it. The re-read list above settles what really happened, so the
      // row is put back into whichever state matches it.
      let confirmed = 0;
      for (const result of results) {
        if (result.ok) continue;
        const row = rowByKey(result.key);
        const item = items.find((candidate) => candidate.key === result.key);
        if (!row || !item || row.mapId === null) continue;

        const reconciliation = reconcileFailedUpload(item, storedFiles.value[row.mapId]);
        row.message = [result.message, reconciliation.message].filter(Boolean).join(" ");
        if (reconciliation.outcome === "confirmed") {
          row.state = "uploaded";
          row.mapFile = reconciliation.mapFile;
          confirmed++;
        } else if (reconciliation.outcome === "retry") {
          // Back in front of the planner, which will offer it as an upload
          // again. Its message stays, so the failure is still on screen.
          row.state = "pending";
        }
      }

      const uploaded = results.filter((result) => result.ok && !result.reused).length;
      const reused = results.filter((result) => result.ok && result.reused).length;

      tally.succeeded += uploaded + reused + confirmed;
      tally.failed += results.filter((result) => !result.ok).length - confirmed;
      if (uploaded > 0) tally.headlines.push(`Uploaded ${uploaded} file${uploaded === 1 ? "" : "s"}.`);
      if (reused > 0) {
        tally.headlines.push(`${reused} file${reused === 1 ? " was" : "s were"} already stored and will be reused.`);
      }
      if (confirmed > 0) {
        tally.headlines.push(
          `${confirmed} upload${confirmed === 1 ? " was" : "s were"} confirmed from the maps' stored files.`,
        );
      }
      if (uploaded + reused + confirmed > 0) {
        tally.hint = "Use \"Select uploaded\" to make them the active files for their maps.";
      }

      return uploaded + reused + confirmed;
    }

    // The rows the run is about to work on, which are the ones it will report on
    // itself. "Select uploaded" is also the retry for a row whose map update
    // failed, so what that row looks like now is not held against it as well.
    function actingKeys(action: RunAction): string[] {
      const keys: string[] = [];
      if (action !== "select") keys.push(...readyRows.value.map((row) => row.key));
      if (action !== "upload") keys.push(...selectableRows.value.map((row) => row.key));
      return keys;
    }

    // Nothing below the buttons is allowed to escape as an unhandled rejection:
    // a row left mid-flight would have no way back except a full Reset.
    async function run(action: RunAction, body: (tally: RunTally) => Promise<void>): Promise<void> {
      // Taken before the run is marked as started: nothing may leave the dialog
      // looking busy forever.
      const tally = startTally(rows.value.map((row) => ({ key: row.key, status: statusOf(row) })), actingKeys(action));

      runningAction.value = action;
      error.value = "";
      successMessage.value = "";

      try {
        await body(tally);
      } catch (err) {
        tally.fatal = err instanceof Error ? err.message : "The run stopped unexpectedly.";
        tally.failed++;
        for (const row of rows.value) {
          if (row.state !== "uploading") continue;
          row.state = "failed";
          row.message = tally.fatal;
        }
      } finally {
        runningAction.value = null;
      }

      const summary = summarizeRun(tally);
      successMessage.value = summary.successMessage;
      // `error` may already hold an early bail ("No files ready to upload."),
      // which the summary has nothing to say about.
      error.value = summary.error || error.value;
      if (summary.mayComplete) context.emit("completed", tally.succeeded);
    }

    async function runUpload(): Promise<void> {
      await run("upload", async (tally) => {
        await uploadFiles(tally);
      });
    }

    async function runSelect(): Promise<void> {
      await run("select", selectAll);
    }

    // The two steps are almost always used together; keep them available
    // separately for the cases where an admin wants to check before selecting.
    async function runUploadAndSelect(): Promise<void> {
      await run("upload-select", async (tally) => {
        const uploaded = await uploadFiles(tally);
        if (uploaded > 0) await selectAll(tally);
      });
    }

    async function selectAll(tally: RunTally): Promise<void> {
      const pending = selectableRows.value;
      if (pending.length === 0) {
        error.value = "No files to select.";
        return;
      }

      const items: BulkSelectItem[] = pending.map((row) => ({
        key: row.key,
        mapId: row.mapId as number,
        mapFile: row.mapFile as MapFileData,
      }));

      const results = await selectMapFiles(items, {
        updateMap: (map) => mapsManagementStore.updateMap(map),
        // Read once to build each update from the map as it is now, and once
        // afterwards to turn "the PUT answered 200" into "the map really points at
        // the new file".
        reloadMaps: async () => {
          await mapsManagementStore.loadMaps();
          return mapsManagementStore.maps;
        },
      });

      for (const result of results) {
        const row = rowByKey(result.key);
        if (!row) continue;
        row.state = result.ok ? "selected" : "failed";
        row.message = result.message;
        row.map = mapsManagementStore.maps.find((map) => map.id === row.mapId) ?? row.map;
        row.currentFileName = mapFileName(row.map?.gameMap?.path);
      }

      const selected = results.filter((result) => result.ok).length;
      // The upload phase already counted these rows; the run reports what finally
      // happened to them, not both steps.
      tally.succeeded = selected;
      tally.failed += results.filter((result) => !result.ok).length;
      tally.hint = "";
      tally.notifiesParent = true;
      if (selected > 0) tally.headlines.push(`Selected ${selected} map${selected === 1 ? "" : "s"}.`);
    }

    function reset(): void {
      // Anything still in flight belongs to the batch that is being dropped, so
      // its answer is discarded and it no longer holds the dialog busy.
      storedGeneration++;
      lookupsInFlight.value = 0;
      files.value = [];
      rows.value = [];
      storedFiles.value = {};
      hashingKeys.clear();
      lookupKeys.clear();
      error.value = "";
      successMessage.value = "";
      uploadIndex.value = 0;
      uploadTotal.value = 0;
      uploadingFileName.value = "";
      currentRowPercent.value = 0;
    }

    function cancel(): void {
      context.emit("cancel");
    }

    return {
      files,
      rows,
      readyRows,
      duplicateRows,
      skippedRows,
      uploadedRows,
      selectableRows,
      selectedRows,
      problemRows,
      uploading,
      preparing,
      busy,
      gating,
      error,
      successMessage,
      runUpload,
      runSelect,
      runUploadAndSelect,
      runningAction,
      duplicateMapIds,
      mapOptions,
      isFixable,
      canRename,
      renameRow,
      assignMap,
      statusOf,
      messageOf,
      uploadIndex,
      uploadTotal,
      uploadingFileName,
      currentRowPercent,
      mdiAlertOutline,
      reset,
      cancel,
      statusColor,
      statusIcon,
      statusLabel,
    };
  },
});
</script>
