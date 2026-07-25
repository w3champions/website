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
        <div class="d-flex align-center ga-2 mb-3">
          <span class="text-medium-emphasis">Currently selected:</span>
          <v-chip v-if="currentFileName" color="success" variant="flat" size="small" :prepend-icon="mdiCheckCircle">
            {{ currentFileName }}
          </v-chip>
          <v-chip v-else color="warning" variant="flat" size="small" :prepend-icon="mdiAlertCircleOutline">
            No file selected
          </v-chip>
        </div>

        <v-data-table
          ref="fileTable"
          :headers="headers"
          :items="mapFiles"
          class="elevation-1 map-files-table"
          :hide-default-footer="true"
          :items-per-page="100"
          height="320"
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

        <div class="mt-5"></div>
        <span class="text-subtitle-1">Add file</span>
        <v-alert v-if="uploadError" type="error" closable class="mt-2" @update:model-value="uploadError = ''">
          {{ uploadError }}
        </v-alert>
        <v-row>
          <v-col cols="12">
            <map-file-drop-zone v-model="files" label="Drag & drop a map file here" />
          </v-col>

          <v-col cols="12" sm="6" md="12" class="pt-0">
            <v-text-field
              v-model="fileName"
              label="File name (optional)"
              variant="underlined"
              color="primary"
            />
          </v-col>
        </v-row>
        <v-btn
          color="primary"
          class="mb-2 text-w3-race-bg"
          :disabled="!file || uploading"
          :loading="uploading"
          @click="addMapFile()"
        >
          Add map file
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

    <v-dialog v-model="isConfirmOpen" max-width="520px">
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
import { ComponentPublicInstance, computed, defineComponent, nextTick, onMounted, PropType, ref } from "vue";
import { Map, MapFileData } from "@/store/admin/mapsManagement/types";
import { useMapsManagementStore } from "@/store/admin/mapsManagement/store";
import { DataTableHeader } from "vuetify";
import { mdiAlertCircleOutline, mdiCheckCircle, mdiChevronDown, mdiChevronUp } from "@mdi/js";
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
        formData.append("fileName", fileName.value);
        await mapsManagementStore.createMapFile(formData, (percent) => uploadPercent.value = percent);
        await mapsManagementStore.loadMapFiles(props.map.id);

        fileName.value = "";
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
      { title: "Actions", value: "actions", sortable: false, width: 180, nowrap: true },
    ];

    return {
      mdiAlertCircleOutline,
      mdiCheckCircle,
      mdiChevronDown,
      mdiChevronUp,
      headers,
      fileTable,
      mapFiles,
      selectMapFile,
      confirmSelectMapFile,
      isConfirmOpen,
      pendingFile,
      uploadPercent,
      uploadError,
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

.map-files-table :deep(td) {
  word-break: break-word;
}

:deep(.map-file-row--selected) {
  background-color: rgba(var(--v-theme-success), 0.12);
}
</style>
