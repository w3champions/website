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
          class="elevation-1"
          :hide-default-footer="true"
          :items-per-page="100"
          height="320"
          fixed-header
          :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
          :row-props="rowProps"
        >
          <template v-slot:[`item.actions`]="{ item }">
            <!-- Re-selecting the file the map already points at is a no-op, so show
                 the state instead of an action. -->
            <v-chip v-if="isSelected(item)" color="success" variant="flat" size="small" :prepend-icon="mdiCheckCircle">
              Selected
            </v-chip>
            <v-btn v-else color="primary" size="small" class="text-w3-race-bg" @click="selectMapFile(item)">
              Select
            </v-btn>
          </template>
        </v-data-table>

        <div class="mt-5"></div>
        <span class="text-subtitle-1">Add file</span>
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
      </v-container>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="cancel">
        {{ $t(`views_admin.cancel`) }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { ComponentPublicInstance, computed, defineComponent, nextTick, onMounted, PropType, ref } from "vue";
import { Map, MapFileData } from "@/store/admin/mapsManagement/types";
import { useMapsManagementStore } from "@/store/admin/mapsManagement/store";
import { DataTableHeader } from "vuetify";
import { mdiAlertCircleOutline, mdiCheckCircle } from "@mdi/js";
import MapFileDropZone from "./MapFileDropZone.vue";
import { isSameMapFile, mapFileName } from "./mapFilePath";

export default defineComponent({
  name: "EditMapFiles",
  components: { MapFileDropZone },
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
      if (confirm(`Are you sure you want to select file with path ${mapFile.filePath}?`)) {
        context.emit("selected", { map: props.map, file: mapFile });
      }
    }

    function cancel() {
      context.emit("cancel");
    }

    async function addMapFile() {
      const selectedFile = file.value;
      if (!selectedFile) return;

      uploading.value = true;
      try {
        if (selectedFile.name.length > maxMapFileNameLength) {
          throw new Error(`File name exceeds maximum character length of ${maxMapFileNameLength}.`);
        }
        const formData = new FormData();
        formData.append("mapId", props.map.id.toString());
        formData.append("mapFile", selectedFile, selectedFile.name);
        formData.append("fileName", fileName.value);
        await mapsManagementStore.createMapFile(formData);
        await mapsManagementStore.loadMapFiles(props.map.id);

        fileName.value = "";
        files.value = [];
      } catch(err) {
        alert(err ? err : "Error trying to create map file.");
      } finally {
        uploading.value = false;
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
      await mapsManagementStore.loadMapFiles(props.map.id);
      await scrollToSelectedFile();
    });

    const headers: DataTableHeader[] = [
      { title: "File path", value: "filePath" },
      { title: "Actions", value: "actions", sortable: false },
    ];

    return {
      mdiAlertCircleOutline,
      mdiCheckCircle,
      headers,
      fileTable,
      mapFiles,
      selectMapFile,
      isSelected,
      rowProps,
      currentFileName,
      file,
      files,
      fileName,
      uploading,
      addMapFile,
      cancel,
    };
  },
});
</script>

<style lang="scss" scoped>
:deep(.map-file-row--selected) {
  background-color: rgba(var(--v-theme-success), 0.12);
}
</style>
