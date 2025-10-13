<template>
  <v-card>
    <v-card-title>
      <span class="text-h5">Bulk Map Upload</span>
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-alert v-if="error" type="error" dismissible @input="error = ''">
          {{ error }}
        </v-alert>

        <v-alert type="info" outlined class="mb-4">
          <div class="text-subtitle-2 mb-2">Instructions:</div>
          <ul class="ml-4">
            <li>Select multiple .w3m or .w3x files</li>
            <li>Filenames must be in format: <code>{map_id}_{name}.w3m</code> or <code>{map_id}_{name}.w3x</code></li>
            <li>Example: <code>5529_twisted_meadows.w3m</code> (map_id = 5529)</li>
            <li>Maps with the specified IDs must already exist in the system</li>
          </ul>
        </v-alert>

        <v-file-input
          v-model="files"
          label="Select map files (.w3m, .w3x)"
          multiple
          accept=".w3m,.w3x"
          truncate-length="50"
          :disabled="uploading || selecting"
          chips
          show-size
          counter
        />

        <v-row class="mt-2">
          <v-col>
            <v-btn
              color="primary"
              class="w3-race-bg--text mr-2"
              :disabled="!files || files.length === 0 || uploading || selecting"
              :loading="uploading"
              @click="uploadFiles"
            >
              Upload Files
            </v-btn>
            <v-btn
              color="success"
              class="mr-2"
              :disabled="uploadedFiles.length === 0 || uploading || selecting"
              :loading="selecting"
              @click="selectAll"
            >
              Select All ({{ uploadedFiles.length }})
            </v-btn>
            <v-btn
              :disabled="uploading || selecting"
              text
              @click="reset"
            >
              Reset
            </v-btn>
          </v-col>
        </v-row>

        <v-divider class="my-4" />

        <div v-if="uploadProgress.length > 0">
          <div class="text-h6 mb-3">Upload Progress</div>
          <v-data-table
            :headers="progressHeaders"
            :items="uploadProgress"
            :items-per-page="-1"
            hide-default-footer
            dense
          >
            <template v-slot:[`item.status`]="{ item }">
              <v-chip :color="getStatusColor(item.status)" small>
                {{ item.status }}
              </v-chip>
            </template>
            <template v-slot:[`item.fileName`]="{ item }">
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <span v-bind="attrs" v-on="on">{{ item.fileName }}</span>
                </template>
                <span>{{ item.fileName }}</span>
              </v-tooltip>
            </template>
          </v-data-table>
        </div>

        <div v-if="uploadedFiles.length > 0" class="mt-4">
          <div class="text-h6 mb-3">Ready to Select ({{ uploadedFiles.length }} files)</div>
          <v-simple-table dense>
            <template v-slot:default>
              <thead>
                <tr>
                  <th>Map ID</th>
                  <th>File Name</th>
                  <th>File Path</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="file in uploadedFiles" :key="file.mapId">
                  <td>{{ file.mapId }}</td>
                  <td>{{ file.fileName }}</td>
                  <td>{{ file.filePath }}</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </div>
      </v-container>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn :disabled="uploading || selecting" text @click="cancel">
        Close
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useMapsManagementStore } from "@/store/admin/mapsManagement/store";
import { Map, MapFileData } from "@/store/admin/mapsManagement/types";

interface UploadProgress {
  fileName: string;
  mapId: number;
  status: "pending" | "uploading" | "success" | "error";
  message?: string;
}

interface UploadedFile {
  mapId: number;
  fileName: string;
  filePath: string;
  mapFileData: MapFileData;
  map: Map;
}

export default defineComponent({
  name: "BulkMapUpload",
  setup(props, context) {
    const mapsManagementStore = useMapsManagementStore();
    const files = ref<File[]>([]);
    const uploadProgress = ref<UploadProgress[]>([]);
    const uploadedFiles = ref<UploadedFile[]>([]);
    const uploading = ref<boolean>(false);
    const selecting = ref<boolean>(false);
    const error = ref<string>("");

    const progressHeaders = [
      { text: "File Name", value: "fileName" },
      { text: "Map ID", value: "mapId" },
      { text: "Status", value: "status" },
      { text: "Message", value: "message" },
    ];

    function extractMapIdFromFilename(filename: string): number | null {
      // Extract map ID from format: {map_id}_{name}.w3m or {map_id}_{name}.w3x
      const match = filename.match(/^(\d+)_/);
      if (match) {
        return parseInt(match[1], 10);
      }
      return null;
    }

    function getStatusColor(status: string): string {
      switch (status) {
        case "success": return "success";
        case "error": return "error";
        case "uploading": return "info";
        default: return "default";
      }
    }

    async function uploadFiles(): Promise<void> {
      if (!files.value || files.value.length === 0) {
        error.value = "Please select at least one file.";
        return;
      }

      uploading.value = true;
      error.value = "";
      uploadProgress.value = [];
      uploadedFiles.value = [];

      // Parse all files first
      const filesToUpload: { file: File; mapId: number }[] = [];
      for (const file of files.value) {
        const mapId = extractMapIdFromFilename(file.name);
        if (mapId === null) {
          uploadProgress.value.push({
            fileName: file.name,
            mapId: -1,
            status: "error",
            message: "Invalid filename format. Expected: {map_id}_{name}.w3m or {map_id}_{name}.w3x",
          });
          continue;
        }

        // Check if map exists
        const map = mapsManagementStore.maps.find((m) => m.id === mapId);
        if (!map) {
          uploadProgress.value.push({
            fileName: file.name,
            mapId,
            status: "error",
            message: `Map with ID ${mapId} does not exist`,
          });
          continue;
        }

        filesToUpload.push({ file, mapId });
        uploadProgress.value.push({
          fileName: file.name,
          mapId,
          status: "pending",
        });
      }

      // Upload files sequentially
      for (let i = 0; i < filesToUpload.length; i++) {
        const { file, mapId } = filesToUpload[i];
        const progressIndex = uploadProgress.value.findIndex(
          (p) => p.fileName === file.name && p.mapId === mapId
        );

        uploadProgress.value[progressIndex].status = "uploading";

        try {
          const formData = new FormData();
          formData.append("mapId", mapId.toString());
          formData.append("mapFile", file, file.name);
          formData.append("fileName", "");

          await mapsManagementStore.createMapFile(formData);

          // Load the uploaded files for this map
          await mapsManagementStore.loadMapFiles(mapId);

          // Find the newly uploaded file
          const mapFileData = mapsManagementStore.mapFiles.find(
            (mf) => mf.filePath.includes(file.name) || mf.filePath.endsWith(file.name.replace(/\.(w3m|w3x)$/, ""))
          );

          if (!mapFileData) {
            uploadProgress.value[progressIndex].status = "error";
            uploadProgress.value[progressIndex].message = "File uploaded but could not be found";
            continue;
          }

          const map = mapsManagementStore.maps.find((m) => m.id === mapId);
          if (!map) {
            uploadProgress.value[progressIndex].status = "error";
            uploadProgress.value[progressIndex].message = "Map not found after upload";
            continue;
          }

          uploadProgress.value[progressIndex].status = "success";
          uploadedFiles.value.push({
            mapId,
            fileName: file.name,
            filePath: mapFileData.filePath,
            mapFileData,
            map,
          });
        } catch (err) {
          uploadProgress.value[progressIndex].status = "error";
          uploadProgress.value[progressIndex].message = err instanceof Error ? err.message : "Upload failed";
        }
      }

      uploading.value = false;
    }

    async function selectAll(): Promise<void> {
      if (uploadedFiles.value.length === 0) {
        error.value = "No files to select.";
        return;
      }

      selecting.value = true;
      error.value = "";

      let successCount = 0;
      let errorCount = 0;

      for (const uploadedFile of uploadedFiles.value) {
        try {
          const map = { ...uploadedFile.map };
          map.gameMap = uploadedFile.mapFileData.metaData;
          map.gameMap.path = `maps\\${uploadedFile.mapFileData.filePath.replaceAll("/", "\\")}`;

          await mapsManagementStore.updateMap(map);
          successCount++;
        } catch (err) {
          errorCount++;
          console.error(`Failed to select file for map ${uploadedFile.mapId}:`, err);
        }
      }

      selecting.value = false;

      if (errorCount > 0) {
        error.value = `Selected ${successCount} maps successfully. ${errorCount} failed.`;
      } else {
        // Reload maps to reflect changes
        await mapsManagementStore.loadMaps();
        // Clear the list after successful selection
        uploadedFiles.value = [];
        uploadProgress.value = [];
        files.value = [];
        context.emit("completed", successCount);
      }
    }

    function reset(): void {
      files.value = [];
      uploadProgress.value = [];
      uploadedFiles.value = [];
      error.value = "";
    }

    function cancel(): void {
      context.emit("cancel");
    }

    return {
      files,
      uploadProgress,
      uploadedFiles,
      uploading,
      selecting,
      error,
      progressHeaders,
      uploadFiles,
      selectAll,
      reset,
      cancel,
      getStatusColor,
    };
  },
});
</script>
