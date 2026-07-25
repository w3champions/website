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

        <v-row class="mt-2">
          <v-col>
            <v-btn
              color="primary"
              class="text-w3-race-bg mr-2"
              :disabled="readyRows.length === 0 || uploading || selecting"
              :loading="uploading"
              @click="uploadFiles"
            >
              Upload {{ readyRows.length ? `${readyRows.length} file${readyRows.length === 1 ? "" : "s"}` : "files" }}
            </v-btn>
            <v-btn
              color="success"
              class="mr-2 text-w3-race-bg"
              :disabled="uploadedRows.length === 0 || uploading || selecting"
              :loading="selecting"
              @click="selectAll"
            >
              Select All ({{ uploadedRows.length }})
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
              <span v-if="item.mapId !== null">{{ item.mapId }}</span>
              <span v-else class="text-medium-emphasis">&mdash;</span>
            </template>

            <template v-slot:[`item.mapName`]="{ item }">
              <span v-if="item.map">{{ item.map.name }}</span>
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
import { mdiAlertCircleOutline, mdiCheckCircle, mdiCloudCheckOutline, mdiFileQuestionOutline, mdiProgressUpload } from "@mdi/js";
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

    async function uploadFiles(): Promise<void> {
      const pending = readyRows.value;
      if (pending.length === 0) {
        error.value = "No files ready to upload.";
        return;
      }

      uploading.value = true;
      error.value = "";
      successMessage.value = "";

      for (const row of pending) {
        row.status = "uploading";
        row.message = undefined;

        try {
          const formData = new FormData();
          formData.append("mapId", String(row.mapId));
          formData.append("mapFile", row.file, row.file.name);
          formData.append("fileName", "");

          await mapsManagementStore.createMapFile(formData);

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

      const failed = rows.value.filter((row) => row.status === "error").length;
      const uploaded = uploadedRows.value.length;
      if (uploaded > 0) {
        successMessage.value = `Uploaded ${uploaded} file${uploaded === 1 ? "" : "s"}.`
          + " Use \"Select All\" to make them the active files for their maps.";
      }
      if (failed > 0) {
        error.value = `${failed} file${failed === 1 ? "" : "s"} failed to upload. See the table for details.`;
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
      reset,
      cancel,
      statusColor,
      statusIcon,
      statusLabel,
    };
  },
});
</script>
