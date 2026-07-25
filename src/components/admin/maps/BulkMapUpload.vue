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
            <v-btn
              color="secondary"
              class="text-w3-race-bg"
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
            <v-chip v-if="problemRows.length" color="error" size="small" variant="flat">
              {{ problemRows.length }} need attention
            </v-chip>
          </div>

          <v-data-table
            :headers="headers"
            :items="rows"
            :items-per-page="-1"
            hide-default-footer
            density="compact"
            item-value="key"
            :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
          >
            <template v-slot:[`item.fileName`]="{ item }">
              <v-tooltip location="bottom" content-class="w3-tooltip elevation-1">
                <template v-slot:activator="{ props }">
                  <span v-bind="props">{{ item.fileName }}</span>
                </template>
                <span>{{ item.fileName }}</span>
              </v-tooltip>
            </template>

            <template v-slot:[`item.mapId`]="{ item }">
              <div class="d-flex align-center ga-1">
                <span v-if="item.mapId !== null">{{ item.mapId }}</span>
                <span v-else class="text-medium-emphasis">&mdash;</span>
                <v-tooltip
                  v-if="item.mapId !== null && duplicateMapIds.includes(item.mapId)"
                  location="bottom"
                  content-class="w3-tooltip elevation-1"
                  text="Another selected file targets this same map"
                >
                  <template v-slot:activator="{ props }">
                    <v-icon v-bind="props" size="small" color="warning">{{ mdiAlertOutline }}</v-icon>
                  </template>
                </v-tooltip>
              </div>
            </template>

            <template v-slot:[`item.mapName`]="{ item }">
              <!-- Rows we could not match are fixable in place: pick the map here
                   instead of renaming the file and dropping it again. -->
              <v-autocomplete
                v-if="isFixable(item)"
                :model-value="item.map ? item.mapId : null"
                :items="mapOptions"
                item-title="title"
                item-value="value"
                label="Pick a map"
                density="compact"
                variant="underlined"
                color="primary"
                hide-details
                :disabled="uploading || selecting"
                style="min-width: 220px;"
                @update:model-value="assignMap(item, $event)"
              />
              <span v-else-if="item.map">{{ item.map.name }}</span>
              <span v-else class="text-medium-emphasis">Unknown map</span>
            </template>

            <template v-slot:[`item.category`]="{ item }">
              <v-chip v-if="item.map?.category" size="x-small" variant="tonal">
                {{ item.map.category }}
              </v-chip>
              <span v-else class="text-medium-emphasis">&mdash;</span>
            </template>

            <template v-slot:[`item.currentFile`]="{ item }">
              <span v-if="item.currentFileName">{{ item.currentFileName }}</span>
              <span v-else class="text-medium-emphasis">None</span>
            </template>

            <template v-slot:[`item.status`]="{ item }">
              <v-chip :color="statusColor(item.status)" variant="flat" size="small" :prepend-icon="statusIcon(item.status)">
                {{ statusLabel(item.status) }}
              </v-chip>
              <v-progress-linear
                v-if="item.status === 'uploading'"
                :model-value="item.percent"
                :indeterminate="item.percent >= 100"
                color="primary"
                height="4"
                rounded
                class="mt-1"
                style="min-width: 90px;"
              />
              <div v-if="item.message" class="text-caption text-medium-emphasis mt-1">
                {{ item.message }}
              </div>
            </template>
          </v-data-table>
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

    const headers = [
      { title: "File name", key: "fileName", sortable: false },
      { title: "Map ID", key: "mapId", sortable: false },
      { title: "Map name", key: "mapName", sortable: false },
      { title: "Category", key: "category", sortable: false },
      { title: "Current file", key: "currentFile", sortable: false },
      { title: "Status", key: "status", sortable: false },
    ];

    const readyRows = computed<BulkRow[]>(() => rows.value.filter((row) => row.status === "ready"));
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
          formData.append("fileName", "");

          await mapsManagementStore.createMapFile(formData, (percent) => {
            row.percent = percent;
            currentRowPercent.value = percent;
          });

          // The create endpoint does not return the stored file, so re-read the
          // map's files and match the one named after the upload.
          await mapsManagementStore.loadMapFiles(row.mapId as number);
          const mapFileData = mapsManagementStore.mapFiles.find(
            (mf) => mapFileName(mf.filePath) === row.file.name.toLowerCase()
          ) ?? mapsManagementStore.mapFiles.find((mf) => mf.filePath.includes(row.file.name));

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
      headers,
      uploadFiles,
      selectAll,
      runUpload,
      runSelect,
      runUploadAndSelect,
      runningAction,
      duplicateMapIds,
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
