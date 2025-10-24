<template>
  <v-card>
    <v-card-title>
      Edit map files
    </v-card-title>
    <v-row dense justify="center">
      <div class="text-h6">{{ map.name }} ({{ map.id }})</div>
    </v-row>
    <v-card-text>
      <v-container>
        <v-data-table
          :headers="headers"
          :items="mapFiles"
          class="elevation-1"
          :hide-default-footer="true"
          :items-per-page="100"
          :header-props="{ class: ['w3-gray-text', 'font-weight-bold'] }"
        >
          <template v-slot:[`item.actions`]="{ item }">
            <v-btn color="primary" class="mb-2 w3-race-bg--text" @click="selectMapFile(item)">Select</v-btn>
          </template>
        </v-data-table>

        <div class="mt-5"></div>
        <span class="text-subtitle-1">Add file</span>
        <v-row>
          <v-col cols="12" sm="6" md="12">
            <v-file-input v-model="file" label="Map file" truncate-length="70" variant="underlined" />
          </v-col>

          <v-col cols="12" sm="6" md="12">
            <v-text-field v-model="fileName" label="File name (optional)" variant="underlined" />
          </v-col>
        </v-row>
        <v-btn color="primary" class="mb-2 w3-race-bg--text" @click="addMapFile()">Add map file</v-btn>
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
import { computed, defineComponent, onMounted, PropType, ref } from "vue";
import { Map, MapFileData } from "@/store/admin/mapsManagement/types";
import { useMapsManagementStore } from "@/store/admin/mapsManagement/store";
import { DataTableHeader } from "vuetify";

export default defineComponent({
  name: "EditMapFiles",
  components: {},
  props: {
    map: {
      type: Object as PropType<Map>,
      required: true,
    },
  },
  setup(props, context) {
    const mapsManagementStore = useMapsManagementStore();
    const fileName = ref<string>("");
    const file = ref<File>({} as File);
    const mapFiles = computed<MapFileData[]>(() => mapsManagementStore.mapFiles);
    const maxMapFileNameLength = 60; // Very long file names break the Admin Maps UI

    function selectMapFile(file: MapFileData) {
      if (confirm(`Are you sure you want to select file with path ${file.filePath}?`)) {
        context.emit("selected", { map: props.map, file });
      }
    }

    function cancel() {
      context.emit("cancel");
    }

    async function addMapFile() {
      try {
        if (file.value.name.length > maxMapFileNameLength) {
          throw new Error(`File name exceeds maximum character length of ${maxMapFileNameLength}.`);
        }
        const formData = new FormData();
        formData.append("mapId", props.map.id.toString());
        formData.append("mapFile", file.value, file.value.name);
        formData.append("fileName", fileName.value);
        await mapsManagementStore.createMapFile(formData);
        await mapsManagementStore.loadMapFiles(props.map.id);

        fileName.value = "";
        file.value = {} as File;
      } catch(err) {
        err ? alert(err) : alert("Error trying to create map file.");
      }
    }

    onMounted(async (): Promise<void> => {
      await mapsManagementStore.loadMapFiles(props.map.id);
    });

    const headers: DataTableHeader[] = [
      { title: "File path", value: "filePath" },
      { title: "Actions", value: "actions", sortable: false },
    ];

    return {
      headers,
      mapFiles,
      selectMapFile,
      file,
      fileName,
      addMapFile,
      cancel,
    };
  },
});
</script>
