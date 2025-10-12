<template>
  <div>
    <v-card-title>
      Manage Maps
    </v-card-title>
    <v-container>
      <v-card class="pa-md-4">
        <v-btn color="primary" class="mb-2 mr-2 w3-race-bg--text" @click="addMap">Add map</v-btn>
        <v-btn color="secondary" class="mb-2 w3-race-bg--text" @click="openBulkUpload">Bulk Upload</v-btn>
        <v-checkbox v-model="adminMapsFilters.hideDisabled" label="Hide disabled maps" dense hide-details />
        <v-dialog v-if="isEditOpen" v-model="isEditOpen" max-width="800px">
          <edit-map :map="editedMap" :isAddDialog="isAddDialog" @cancel="closeEdit" @save="saveMap" />
        </v-dialog>

        <v-dialog v-if="isEditFilesOpen" v-model="isEditFilesOpen" max-width="800px">
          <edit-map-files :map="editedMap" @cancel="closeEditFiles" @selected="mapFileSelected" />
        </v-dialog>

        <v-dialog v-if="isBulkUploadOpen" v-model="isBulkUploadOpen" max-width="1000px">
          <bulk-map-upload @cancel="closeBulkUpload" @completed="handleBulkUploadCompleted" />
        </v-dialog>

        <v-text-field v-model="search" label="Search" />
        <v-data-table
          :headers="headers"
          :items="maps"
          :items-per-page="10"
          :footer-props="{ itemsPerPageOptions: [10, 25, 50, -1] }"
          :search="search"
          class="elevation-1"
        >
          <template v-slot:[`item.path`]="{ item }">
            {{ getMapPath(item) }}
          </template>
          <template v-slot:[`item.actions`]="{ item }">
            <v-icon small class="mr-2" @click="configureMap(item)">{{ mdiPencil }}</v-icon>
            <v-icon small class="mr-2" @click="configureMapFiles(item)">{{ mdiFile }}</v-icon>
          </template>
        </v-data-table>
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import { AdminMapsFilters, Map, MapFileData } from "@/store/admin/mapsManagement/types";
import EditMap from "./maps/EditMap.vue";
import EditMapFiles from "./maps/EditMapFiles.vue";
import BulkMapUpload from "./maps/BulkMapUpload.vue";
import { useMapsManagementStore } from "@/store/admin/mapsManagement/store";
import { useOauthStore } from "@/store/oauth/store";
import { mdiFile, mdiPencil } from "@mdi/js";

export default defineComponent({
  name: "AdminMaps",
  components: {
    EditMap,
    EditMapFiles,
    BulkMapUpload,
  },
  setup() {
    const oauthStore = useOauthStore();
    const mapsManagementStore = useMapsManagementStore();

    const search = ref<string>("");
    const editedMap = ref<Map>({} as Map);
    const isEditOpen = ref<boolean>(false);
    const isEditFilesOpen = ref<boolean>(false);
    const isAddDialog = ref<boolean>(false);
    const isBulkUploadOpen = ref<boolean>(false);

    const adminMapsFilters = ref<AdminMapsFilters>({ hideDisabled: false });

    const maps = computed<Map[]>(() => {
      if (adminMapsFilters.value.hideDisabled) {
        return mapsManagementStore.maps.filter((x) => !x.disabled);
      }
      return mapsManagementStore.maps;
    });

    const isAdmin = computed<boolean>(() => oauthStore.isAdmin);

    function getMapPath(map: Map): string {
      const path = map?.gameMap?.path;

      if (path) {
        return path.replaceAll("maps\\", "").replaceAll("\\", "/");
      }

      return "";
    }

    function addMap(): void {
      isAddDialog.value = true;
      isEditOpen.value = true;
      editedMap.value = createDefaultMap();
    }

    function configureMap(map: Map): void {
      isAddDialog.value = false;
      isEditOpen.value = true;
      editedMap.value = Object.assign({}, map);
    }

    function configureMapFiles(map: Map): void {
      isAddDialog.value = false;
      isEditFilesOpen.value = true;
      editedMap.value = Object.assign({}, map);
    }

    function closeEdit(): void {
      isAddDialog.value = false;
      isEditOpen.value = false;
    }

    function closeEditFiles(): void {
      isEditFilesOpen.value = false;
    }

    function openBulkUpload(): void {
      isBulkUploadOpen.value = true;
    }

    function closeBulkUpload(): void {
      isBulkUploadOpen.value = false;
    }

    async function handleBulkUploadCompleted(count: number): Promise<void> {
      alert(`Successfully selected ${count} maps!`);
      closeBulkUpload();
    }

    async function saveMap(map: Map): Promise<void> {
      try {
        if (isAddDialog.value) {
          await mapsManagementStore.createMap(map);
        } else {
          await mapsManagementStore.updateMap(map);
        }
        closeEdit();
        await mapsManagementStore.loadMaps();
      } catch(err) {
        err ? alert(err) : alert("Error trying to select map.");
      }
    }

    async function mapFileSelected(e: { map: Map; file: MapFileData }): Promise<void> {
      const map = e.map as Map;
      const file = e.file as MapFileData;

      map.gameMap = file.metaData;
      map.gameMap.path = `maps\\${file.filePath.replaceAll("/", "\\")}`;

      await saveMap(map);
      closeEditFiles();
    }

    function createDefaultMap(): Map {
      const map: Map = {
        id: -1,
        name: "",
        category: "",
        maxTeams: 2,
        mappedForces: [],
        disabled: false,
      };

      return map;
    }

    watch(isAdmin, init);

    async function init(): Promise<void> {
      if (!isAdmin.value) return;
      await mapsManagementStore.loadMaps();
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    const headers = [
      {
        text: "Map name",
        value: "name",
      },
      {
        text: "ID",
        value: "id",
      },
      {
        text: "Category",
        value: "category",
      },
      {
        text: "Disabled",
        value: "disabled",
      },
      {
        text: "File",
        value: "path",
        sortable: false
      },
      {
        text: "Actions",
        value: "actions",
        sortable: false
      },
    ];

    return {
      mdiFile,
      mdiPencil,
      headers,
      addMap,
      isEditOpen,
      editedMap,
      isAddDialog,
      closeEdit,
      saveMap,
      isEditFilesOpen,
      closeEditFiles,
      mapFileSelected,
      search,
      maps,
      getMapPath,
      configureMap,
      configureMapFiles,
      adminMapsFilters,
      isBulkUploadOpen,
      openBulkUpload,
      closeBulkUpload,
      handleBulkUploadCompleted,
    };
  },
});
</script>

<style lang="scss" scoped>
.container {
  max-width: 1350px;
}
</style>
