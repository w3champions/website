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
          </ul>
        </v-alert>

        <map-file-drop-zone
          v-model="files"
          multiple
          :disabled="uploading || selecting"
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
              :disabled="readyRows.length === 0 || uploading || selecting"
              :loading="runningAction === 'upload'"
              @click="runUpload"
            >
              Upload ({{ readyRows.length }})
            </v-btn>
            <!-- Outlined rather than filled: a disabled filled button renders as a
                 pale block on the dark themes. -->
            <v-btn
              variant="outlined"
              :disabled="readyRows.length === 0 || uploading || selecting"
              :loading="runningAction === 'upload-select'"
              @click="runUploadAndSelect"
            >
              Upload &amp; select
            </v-btn>
            <v-btn
              color="success"
              class="text-w3-race-bg"
              :disabled="uploadedRows.length === 0 || uploading || selecting"
              :loading="runningAction === 'select'"
              @click="runSelect"
            >
              Select uploaded ({{ uploadedRows.length }})
            </v-btn>
            <v-btn
              class="bg-error text-w3-race-bg"
              :disabled="uploading || selecting"
              variant="text"
              @click="reset"
            >
              Reset
            </v-btn>
          </v-col>
        </v-row>

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
            <v-chip v-if="uploadedRows.length" color="warning" size="small" variant="flat">
              {{ uploadedRows.length }} uploaded, not selected
            </v-chip>
            <v-chip v-if="selectedRows.length" color="success" size="small" variant="flat">
              {{ selectedRows.length }} selected
            </v-chip>
            <v-chip v-if="conflictRows.length" color="warning" size="small" variant="flat">
              {{ conflictRows.length }} name conflict{{ conflictRows.length === 1 ? "" : "s" }}
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
                :color="statusColor(row.status)"
                variant="flat"
                size="small"
                :prepend-icon="statusIcon(row.status)"
              >
                {{ statusLabel(row.status) }}
              </v-chip>
            </div>

            <v-progress-linear
              v-if="row.status === 'uploading'"
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
                  :disabled="uploading || selecting"
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
                <v-text-field
                  v-model="row.storeAs"
                  label="Store the file as"
                  density="compact"
                  variant="underlined"
                  color="primary"
                  hide-details
                  :disabled="uploading || selecting"
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

            <div v-if="nameAlreadyStored(row)" class="text-caption text-warning mt-1">
              <v-icon size="x-small" class="mr-1">{{ mdiAlertOutline }}</v-icon>
              This map already has a file stored under this name. Files are never replaced, so it is
              held back until the name is changed.
            </div>

            <div v-if="duplicateNames.includes(row.storeAs.trim().toLowerCase())" class="text-caption text-warning mt-1">
              <v-icon size="x-small" class="mr-1">{{ mdiAlertOutline }}</v-icon>
              Another file in this batch would be stored under this name.
            </div>

            <div v-if="row.message" class="text-caption text-medium-emphasis mt-1">
              {{ row.message }}
            </div>
          </v-card>
        </template>
      </v-container>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn :disabled="uploading || selecting" variant="text" class="bg-primary text-w3-race-bg" @click="cancel">
        Close
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import { useMapsManagementStore } from "@/store/admin/mapsManagement/store";
import { Map, MapFileData } from "@/store/admin/mapsManagement/types";
import { mdiAlertCircleOutline, mdiAlertOutline, mdiCheckCircle, mdiCloudCheckOutline, mdiFileQuestionOutline, mdiProgressUpload } from "@mdi/js";
import MapFileDropZone from "./MapFileDropZone.vue";
import { mapFileName } from "./mapFilePath";

type RowStatus =
  | "invalid-name"
  | "unknown-map"
  | "ready"
  | "uploading"
  | "uploaded"
  | "selected"
  | "error";

interface BulkRow {
  key: string;
  file: File;
  fileName: string;
  mapId: number | null;
  map?: Map;
  currentFileName: string;
  // What the file will be stored as; starts as its own name and is editable.
  storeAs: string;
  status: RowStatus;
  message?: string;
  percent: number;
  mapFileData?: MapFileData;
}

export default defineComponent({
  name: "BulkMapUpload",
  components: { MapFileDropZone },
  setup(props, context) {
    const mapsManagementStore = useMapsManagementStore();
    const files = ref<File[]>([]);
    const rows = ref<BulkRow[]>([]);
    const uploading = ref<boolean>(false);
    const selecting = ref<boolean>(false);
    const error = ref<string>("");
    const successMessage = ref<string>("");
    // Which button is running, so only that one shows a spinner.
    const runningAction = ref<"upload" | "upload-select" | "select" | null>(null);
    const uploadIndex = ref<number>(0);
    const uploadTotal = ref<number>(0);
    const uploadingFileName = ref<string>("");
    const currentRowPercent = ref<number>(0);
    // File names each target map already has, so a name that the server would
    // reject is caught before the upload runs. Keyed by map id.
    const storedNames = ref<Record<number, string[]>>({});

    const readyRows = computed<BulkRow[]>(() =>
      rows.value.filter((row) => row.status === "ready" && !hasNameConflict(row))
    );
    const conflictRows = computed<BulkRow[]>(() =>
      rows.value.filter((row) => row.status === "ready" && hasNameConflict(row))
    );
    const uploadedRows = computed<BulkRow[]>(() => rows.value.filter((row) => row.status === "uploaded"));
    const selectedRows = computed<BulkRow[]>(() => rows.value.filter((row) => row.status === "selected"));
    const problemRows = computed<BulkRow[]>(() =>
      rows.value.filter((row) => ["invalid-name", "unknown-map", "error"].includes(row.status))
    );

    // Two files aimed at the same map both upload fine, but only the last one
    // selected stays active - worth flagging before the admin walks away.
    const duplicateMapIds = computed<number[]>(() => {
      // Note: `Map` is the imported map type here, not the JS global.
      const counts: Record<number, number> = {};
      for (const row of rows.value) {
        if (row.mapId === null) continue;
        counts[row.mapId] = (counts[row.mapId] ?? 0) + 1;
      }
      return Object.keys(counts).map(Number).filter((mapId) => counts[mapId] > 1);
    });

    async function loadStoredNames(mapId: number): Promise<void> {
      if (storedNames.value[mapId]) return;
      try {
        const mapFiles = await mapsManagementStore.fetchMapFiles(mapId);
        storedNames.value[mapId] = mapFiles.map((mapFile) => mapFileName(mapFile.filePath));
      } catch {
        // A failed lookup only costs the warning; the upload still reports the error.
      }
    }

    function nameAlreadyStored(row: BulkRow): boolean {
      if (row.mapId === null) return false;
      const name = row.storeAs.trim().toLowerCase();
      return !!name && (storedNames.value[row.mapId] ?? []).includes(name);
    }

    // Either conflict means the server would reject this file, so it is held back
    // from the upload until the name is changed.
    function hasNameConflict(row: BulkRow): boolean {
      return nameAlreadyStored(row) || duplicateNames.value.includes(row.storeAs.trim().toLowerCase());
    }

    // The update service refuses to overwrite a stored file, so two files heading
    // for the same name means the second one fails.
    const duplicateNames = computed<string[]>(() => {
      const counts: Record<string, number> = {};
      for (const row of rows.value) {
        const name = row.storeAs.trim().toLowerCase();
        if (!name) continue;
        counts[name] = (counts[name] ?? 0) + 1;
      }
      return Object.keys(counts).filter((name) => counts[name] > 1);
    });

    const mapOptions = computed(() =>
      [...mapsManagementStore.maps]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((map) => ({ title: `${map.name} (${map.id})`, value: map.id }))
    );

    function isFixable(row: BulkRow): boolean {
      return row.status === "invalid-name" || row.status === "unknown-map";
    }

    function assignMap(row: BulkRow, mapId: number | null): void {
      const map = mapsManagementStore.maps.find((m) => m.id === mapId);
      if (!map) return;

      row.mapId = map.id;
      row.map = map;
      row.currentFileName = mapFileName(map.gameMap?.path);
      row.status = "ready";
      row.message = undefined;
      void loadStoredNames(map.id);
    }

    function extractMapIdFromFilename(filename: string): number | null {
      // Extract map ID from format: {map_id}_{name}.w3m or {map_id}_{name}.w3x
      const match = filename.match(/^(\d+)_/);
      if (match) {
        return parseInt(match[1], 10);
      }
      return null;
    }

    // Detection runs as soon as files are picked, so problems (bad filename, unknown
    // map id) and the map each file will overwrite are visible before uploading.
    function detectRow(file: File, index: number): BulkRow {
      const mapId = extractMapIdFromFilename(file.name);
      if (mapId === null) {
        return {
          key: `${index}-${file.name}`,
          file,
          fileName: file.name,
          mapId: null,
          currentFileName: "",
          storeAs: file.name,
          percent: 0,
          status: "invalid-name",
          message: "Expected {map_id}_{name}.w3m or {map_id}_{name}.w3x",
        };
      }

      const map = mapsManagementStore.maps.find((m) => m.id === mapId);
      return {
        key: `${index}-${file.name}`,
        file,
        fileName: file.name,
        mapId,
        map,
        currentFileName: mapFileName(map?.gameMap?.path),
        storeAs: file.name,
        percent: 0,
        status: map ? "ready" : "unknown-map",
        message: map ? undefined : `Map with ID ${mapId} does not exist`,
      };
    }

    // Re-detect whenever the picked files change, but keep the outcome of rows whose
    // file was already uploaded or selected so the confirmation is not lost.
    watch(files, (newFiles) => {
      rows.value = newFiles.map((file, index) => {
        const existing = rows.value.find((row) => row.file === file);
        if (existing && ["uploading", "uploaded", "selected", "error"].includes(existing.status)) {
          return existing;
        }
        return detectRow(file, index);
      });
    }, { deep: true });

    // Look up each target map's existing names as soon as the rows settle.
    watch(rows, (currentRows) => {
      const mapIds = [...new Set(currentRows.map((row) => row.mapId).filter((id): id is number => id !== null))];
      mapIds.forEach((mapId) => void loadStoredNames(mapId));
    }, { deep: true, immediate: true });

    function statusLabel(status: RowStatus): string {
      switch (status) {
        case "invalid-name": return "Bad filename";
        case "unknown-map": return "Unknown map";
        case "ready": return "Ready";
        case "uploading": return "Uploading";
        case "uploaded": return "Uploaded";
        case "selected": return "Selected";
        default: return "Error";
      }
    }

    function statusColor(status: RowStatus): string {
      switch (status) {
        case "ready": return "info";
        case "uploading": return "info";
        case "uploaded": return "warning";
        case "selected": return "success";
        default: return "error";
      }
    }

    function statusIcon(status: RowStatus): string {
      switch (status) {
        case "ready": return mdiFileQuestionOutline;
        case "uploading": return mdiProgressUpload;
        case "uploaded": return mdiCloudCheckOutline;
        case "selected": return mdiCheckCircle;
        default: return mdiAlertCircleOutline;
      }
    }

    // Uploads stay sequential: batches are small and one file at a time keeps the
    // progress readable and the server load predictable.
    async function uploadFiles(): Promise<number> {
      const pending = readyRows.value;
      if (pending.length === 0) {
        error.value = "No files ready to upload.";
        return 0;
      }

      uploading.value = true;
      error.value = "";
      successMessage.value = "";
      uploadIndex.value = 0;
      uploadTotal.value = pending.length;

      for (const row of pending) {
        row.status = "uploading";
        row.message = undefined;
        row.percent = 0;
        uploadIndex.value++;
        uploadingFileName.value = row.fileName;
        currentRowPercent.value = 0;

        try {
          const formData = new FormData();
          formData.append("mapId", String(row.mapId));
          formData.append("mapFile", row.file, row.file.name);
          // An untouched name means "no override", which is the empty string the
          // backend already treats as "use the uploaded file's own name".
          const storeAs = row.storeAs.trim();
          formData.append("fileName", storeAs === row.file.name ? "" : storeAs);

          await mapsManagementStore.createMapFile(formData, (percent) => {
            row.percent = percent;
            currentRowPercent.value = percent;
          });

          // The create endpoint does not return the stored file, so re-read the
          // map's files and match the one named after the upload.
          await mapsManagementStore.loadMapFiles(row.mapId as number);
          const storedName = (storeAs || row.file.name).toLowerCase();
          const mapFileData = mapsManagementStore.mapFiles.find(
            (mf) => mapFileName(mf.filePath) === storedName
          ) ?? mapsManagementStore.mapFiles.find((mf) => mf.filePath.includes(storeAs || row.file.name));

          if (!mapFileData) {
            row.status = "error";
            row.message = "File uploaded but could not be found";
            continue;
          }

          row.mapFileData = mapFileData;
          row.status = "uploaded";
        } catch (err) {
          row.status = "error";
          row.message = err instanceof Error ? err.message : "Upload failed";
        }
      }

      uploading.value = false;
      uploadingFileName.value = "";
      currentRowPercent.value = 0;

      const failed = rows.value.filter((row) => row.status === "error").length;
      const uploaded = uploadedRows.value.length;
      if (uploaded > 0) {
        successMessage.value = `Uploaded ${uploaded} file${uploaded === 1 ? "" : "s"}.`
          + " Use \"Select uploaded\" to make them the active files for their maps.";
      }
      if (failed > 0) {
        error.value = `${failed} file${failed === 1 ? "" : "s"} failed to upload. See the table for details.`;
      }
      return uploaded;
    }

    async function runUpload(): Promise<void> {
      runningAction.value = "upload";
      try {
        await uploadFiles();
      } finally {
        runningAction.value = null;
      }
    }

    async function runSelect(): Promise<void> {
      runningAction.value = "select";
      try {
        await selectAll();
      } finally {
        runningAction.value = null;
      }
    }

    // The two steps are almost always used together; keep them available
    // separately for the cases where an admin wants to check before selecting.
    async function runUploadAndSelect(): Promise<void> {
      runningAction.value = "upload-select";
      try {
        const uploaded = await uploadFiles();
        if (uploaded > 0) {
          await selectAll();
        }
      } finally {
        runningAction.value = null;
      }
    }

    async function selectAll(): Promise<void> {
      const pending = uploadedRows.value;
      if (pending.length === 0) {
        error.value = "No files to select.";
        return;
      }

      selecting.value = true;
      error.value = "";
      successMessage.value = "";

      let successCount = 0;
      let errorCount = 0;

      for (const row of pending) {
        try {
          const map = { ...(row.map as Map) };
          map.gameMap = (row.mapFileData as MapFileData).metaData;
          map.gameMap.path = `maps\\${(row.mapFileData as MapFileData).filePath.replaceAll("/", "\\")}`;

          await mapsManagementStore.updateMap(map);
          row.status = "selected";
          row.currentFileName = mapFileName(map.gameMap.path);
          successCount++;
        } catch (err) {
          row.status = "error";
          row.message = err instanceof Error ? err.message : "Failed to select file";
          errorCount++;
        }
      }

      selecting.value = false;

      // Reload so the maps table behind the dialog reflects the new files.
      await mapsManagementStore.loadMaps();

      if (successCount > 0) {
        successMessage.value = `Selected ${successCount} map${successCount === 1 ? "" : "s"}.`;
        context.emit("completed", successCount);
      }
      if (errorCount > 0) {
        error.value = `${errorCount} map${errorCount === 1 ? "" : "s"} could not be selected. See the table for details.`;
      }
    }

    function reset(): void {
      files.value = [];
      rows.value = [];
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
      uploadedRows,
      selectedRows,
      problemRows,
      uploading,
      selecting,
      error,
      successMessage,
      uploadFiles,
      selectAll,
      runUpload,
      runSelect,
      runUploadAndSelect,
      runningAction,
      duplicateMapIds,
      duplicateNames,
      conflictRows,
      nameAlreadyStored,
      mapOptions,
      isFixable,
      assignMap,
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
