<template>
  <v-card class="overflow-hidden">
    <v-card-title>
      Edit map files
    </v-card-title>
    <v-row dense justify="center">
      <div class="text-h6">{{ map.name }} ({{ map.id }})</div>
    </v-row>
    <v-card-text>
      <v-container>
        <map-file-details
          v-if="map.gameMap"
          class="mb-4"
          :game-map="map.gameMap"
          :map="map"
          details-title="Selected map file details"
        />

        <v-data-table
          ref="fileTable"
          :headers="headers"
          :items="mapFiles"
          class="elevation-1 map-files-table"
          :hide-default-footer="true"
          :items-per-page="100"
          fixed-header
          :loading="loadingFiles"
          loading-text="Loading map files…"
          item-value="id"
          :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
          :row-props="rowProps"
        >
          <template v-slot:[`item.actions`]="{ item, internalItem, isExpanded, toggleExpand }">
            <div class="d-flex align-center justify-end ga-2">
              <!-- Re-selecting the file the map already points at is a no-op, so show
                   the state instead of an action. -->
              <v-chip v-if="isSelected(item)" color="success" variant="flat" size="small" :prepend-icon="mdiCheckCircle">
                Selected
              </v-chip>
              <v-btn v-else color="primary" size="small" class="text-w3-race-bg" @click="selectMapFile(item)">
                Select
              </v-btn>
              <v-tooltip location="top" content-class="w3-tooltip elevation-1" text="Download map file">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    :icon="mdiDownload"
                    :href="downloadUrl(item)"
                    target="_blank"
                    rel="noopener"
                    variant="text"
                    size="small"
                    aria-label="Download map file"
                  />
                </template>
              </v-tooltip>
              <v-tooltip
                location="top"
                content-class="w3-tooltip elevation-1"
                :text="isExpanded(internalItem) ? 'Hide file details' : 'Show file details'"
              >
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    :icon="isExpanded(internalItem) ? mdiChevronUp : mdiChevronDown"
                    variant="text"
                    size="small"
                    :aria-label="isExpanded(internalItem) ? 'Hide file details' : 'Show file details'"
                    @click="toggleExpand(internalItem)"
                  />
                </template>
              </v-tooltip>
            </div>
          </template>

          <!-- The metadata is already loaded with the file list, so any file can be
               inspected before it is selected. -->
          <template v-slot:expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="py-3">
                <map-file-details :game-map="item.metaData" :map="map" :collapsible="false" />
              </td>
            </tr>
          </template>
        </v-data-table>

        <div class="text-subtitle-1 mt-6">Upload file</div>
        <v-alert v-if="uploadError" type="error" closable class="mt-2" @update:model-value="uploadError = ''">
          {{ uploadError }}
        </v-alert>

        <!-- Spaced with margins rather than a v-row, whose gutters disappeared with
             the name field and left the button against the drop zone. -->
        <map-file-drop-zone v-model="files" class="mt-3" label="Drag & drop a map file here" />

        <v-alert v-if="duplicateFileName" type="warning" variant="tonal" density="compact" class="mt-3">
          This map already has a file stored as <strong>{{ storedAsName }}</strong>. Files are never
          replaced, so the upload would be rejected - store it under a different name.
        </v-alert>

        <v-text-field
          v-if="file"
          v-model="fileName"
          class="mt-3"
          label="Store the file as"
          hint="Prefilled with the name of the file you picked. Edit it to store it under a different name."
          persistent-hint
          variant="underlined"
          color="primary"
        />

        <v-btn
          color="primary"
          class="mt-4 mb-2 text-w3-race-bg"
          :disabled="!file || uploading || duplicateFileName"
          :loading="uploading"
          @click="addMapFile()"
        >
          Upload
        </v-btn>

        <div v-if="uploading" class="mt-2">
          <v-progress-linear
            :model-value="uploadPercent"
            :indeterminate="uploadPercent >= 100"
            color="primary"
            height="8"
            rounded
          />
          <div class="text-caption text-medium-emphasis mt-1">
            <!-- 100% only means the body reached the server; it still has to store it. -->
            {{ uploadPercent >= 100 ? "Processing on the server…" : `Uploading… ${uploadPercent}%` }}
          </div>
        </div>
      </v-container>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="cancel">
        {{ $t(`views_admin.cancel`) }}
      </v-btn>
    </v-card-actions>

    <!-- Wide enough for the two-column file details; Vuetify's breakpoints go by
         the viewport, so a narrow dialog still gets two columns. -->
    <v-dialog v-model="isConfirmOpen" max-width="720px">
      <v-card>
        <v-card-title>Select this file?</v-card-title>
        <v-card-text>
          <p class="mb-3">
            <strong>{{ map.name }} ({{ map.id }})</strong> will use this file from now on.
          </p>
          <div class="d-flex align-center ga-2 mb-2">
            <span class="text-medium-emphasis" style="min-width: 72px;">Current:</span>
            <span>{{ currentFileName || "No file selected" }}</span>
          </div>
          <div class="d-flex align-center ga-2 mb-3">
            <span class="text-medium-emphasis" style="min-width: 72px;">New:</span>
            <span class="font-weight-medium">{{ pendingFile?.filePath }}</span>
          </div>

          <v-divider class="mb-3" />
          <map-file-details :game-map="pendingFile?.metaData" :map="map" details-title="Incoming file details" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="isConfirmOpen = false">
            {{ $t(`views_admin.cancel`) }}
          </v-btn>
          <v-btn color="primary" variant="flat" @click="confirmSelectMapFile">Select file</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts">
import { ComponentPublicInstance, computed, defineComponent, nextTick, onMounted, PropType, ref, watch } from "vue";
import { Map, MapFileData } from "@/store/admin/mapsManagement/types";
import { useMapsManagementStore } from "@/store/admin/mapsManagement/store";
import MapsService from "@/services/MapsService";
import { DataTableHeader } from "vuetify";
import { mdiCheckCircle, mdiChevronDown, mdiChevronUp, mdiDownload } from "@mdi/js";
import MapFileDropZone from "./MapFileDropZone.vue";
import MapFileDetails from "./MapFileDetails.vue";
import { isSameMapFile, mapFileName } from "./mapFilePath";

export default defineComponent({
  name: "EditMapFiles",
  components: { MapFileDropZone, MapFileDetails },
  props: {
    map: {
      type: Object as PropType<Map>,
      required: true,
    },
  },
  setup(props, context) {
    const mapsManagementStore = useMapsManagementStore();
    const fileTable = ref<ComponentPublicInstance | null>(null);
    const fileName = ref<string>("");
    const files = ref<File[]>([]);
    const uploading = ref<boolean>(false);
    const loadingFiles = ref<boolean>(true);
    const uploadPercent = ref<number>(0);
    const uploadError = ref<string>("");
    const isConfirmOpen = ref<boolean>(false);
    const pendingFile = ref<MapFileData | null>(null);
    const mapFiles = computed<MapFileData[]>(() => mapsManagementStore.mapFiles);
    const maxMapFileNameLength = 60; // Very long file names break the Admin Maps UI

    const file = computed<File | undefined>(() => files.value[0]);
    const currentFileName = computed<string>(() => mapFileName(props.map.gameMap?.path));

    // Start from the picked file's own name so it can be tweaked rather than retyped.
    watch(file, (selected) => {
      fileName.value = selected?.name ?? "";
    });

    // What the file will be stored as: the override if given, else its own name.
    const storedAsName = computed<string>(() => (fileName.value.trim() || file.value?.name || ""));

    // The update service refuses to overwrite an existing file, so a name that is
    // already taken is worth catching before the upload rather than after it fails.
    const duplicateFileName = computed<boolean>(() => {
      const target = storedAsName.value.toLowerCase();
      if (!target) return false;
      return mapFiles.value.some((mapFile) => mapFileName(mapFile.filePath) === target);
    });

    function downloadUrl(mapFile: MapFileData): string {
      return MapsService.getMapFileDownloadUrl(mapFile.filePath);
    }

    function isSelected(mapFile: MapFileData): boolean {
      return isSameMapFile(props.map.gameMap?.path, mapFile.filePath);
    }

    function rowProps({ item }: { item: MapFileData }) {
      return isSelected(item) ? { class: "map-file-row--selected" } : {};
    }

    function selectMapFile(mapFile: MapFileData) {
      pendingFile.value = mapFile;
      isConfirmOpen.value = true;
    }

    function confirmSelectMapFile() {
      const mapFile = pendingFile.value;
      isConfirmOpen.value = false;
      if (!mapFile) return;
      context.emit("selected", { map: props.map, file: mapFile });
    }

    function cancel() {
      context.emit("cancel");
    }

    async function addMapFile() {
      const selectedFile = file.value;
      if (!selectedFile) return;

      uploading.value = true;
      uploadPercent.value = 0;
      uploadError.value = "";
      try {
        if (selectedFile.name.length > maxMapFileNameLength) {
          throw new Error(`File name exceeds maximum character length of ${maxMapFileNameLength}.`);
        }
        const formData = new FormData();
        formData.append("mapId", props.map.id.toString());
        formData.append("mapFile", selectedFile, selectedFile.name);
        // An untouched field means "no override", which is the empty string the
        // backend already treats as "use the uploaded file's own name".
        const nameOverride = fileName.value.trim() === selectedFile.name ? "" : fileName.value.trim();
        formData.append("fileName", nameOverride);
        await mapsManagementStore.createMapFile(formData, (percent) => uploadPercent.value = percent);
        await mapsManagementStore.loadMapFiles(props.map.id);

        files.value = [];
      } catch(err) {
        uploadError.value = err instanceof Error ? err.message : "Error trying to create map file.";
      } finally {
        uploading.value = false;
        uploadPercent.value = 0;
      }
    }

    // A map can have a long list of files; open the list on the one that is in use.
    async function scrollToSelectedFile(): Promise<void> {
      await nextTick();
      const scroller = fileTable.value?.$el?.querySelector(".v-table__wrapper") as HTMLElement | undefined;
      const selectedRow = scroller?.querySelector(".map-file-row--selected") as HTMLElement | undefined;
      if (!scroller || !selectedRow) return;

      const offset = selectedRow.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      scroller.scrollTop += offset - (scroller.clientHeight - selectedRow.clientHeight) / 2;
    }

    onMounted(async (): Promise<void> => {
      loadingFiles.value = true;
      try {
        await mapsManagementStore.loadMapFiles(props.map.id);
      } finally {
        loadingFiles.value = false;
      }
      await scrollToSelectedFile();
    });

    const headers: DataTableHeader[] = [
      { title: "File path", value: "filePath" },
      { title: "Actions", value: "actions", sortable: false, width: 220, nowrap: true },
    ];

    return {
      mdiCheckCircle,
      mdiDownload,
      mdiChevronDown,
      mdiChevronUp,
      headers,
      fileTable,
      mapFiles,
      selectMapFile,
      downloadUrl,
      confirmSelectMapFile,
      isConfirmOpen,
      pendingFile,
      uploadPercent,
      uploadError,
      storedAsName,
      duplicateFileName,
      isSelected,
      rowProps,
      currentFileName,
      file,
      files,
      fileName,
      uploading,
      loadingFiles,
      addMapFile,
      cancel,
    };
  },
});
</script>

<style lang="scss" scoped>
// Expanding a row makes the browser re-measure an auto-laid-out table, so the
// columns shift as rows open and close. Fixed layout keeps them still.
.map-files-table :deep(table) {
  table-layout: fixed;
}

// max-height rather than the height prop, so a short list takes only the room it
// needs instead of leaving a gap under the last row.
.map-files-table :deep(.v-table__wrapper) {
  max-height: 320px;
}

.map-files-table :deep(td) {
  word-break: break-word;
}

:deep(.map-file-row--selected) {
  background-color: rgba(var(--v-theme-success), 0.12);
}
</style>
