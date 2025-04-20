<template>
  <div>
    <v-card-title>
      Manage Maps
    </v-card-title>
    <v-container>
      <v-card class="pa-md-4">
        <v-btn color="primary" class="mb-2 w3-race-bg--text" @click="addMap">Add map</v-btn>
        <v-dialog v-if="isEditOpen" v-model="isEditOpen" max-width="800px">
          <edit-map :map="editedMap" :isAddDialog @cancel="closeEdit" @save="saveMap" />
        </v-dialog>

        <v-dialog v-if="isEditFilesOpen" v-model="isEditFilesOpen" max-width="800px">
          <edit-map-files :map="editedMap" @cancel="closeEditFiles" @selected="mapFileSelected" />
        </v-dialog>

        <v-text-field label="Search" v-model="search" />
        <v-data-table
          :headers
          :items="maps"
          :items-per-page="10"
          :footer-props="{ itemsPerPageOptions: [10, 25, 50, -1] }"
          :search
          class="elevation-1"
        >
          <template #[`item.path`]="{ item }">
            {{ getMapPath(item) }}
          </template>
          <template #[`item.actions`]="{ item }">
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
import { Map, MapFileData } from "@/store/admin/mapsManagement/types";
import EditMap from "./maps/EditMap.vue";
import EditMapFiles from "./maps/EditMapFiles.vue";
import { useMapsManagementStore } from "@/store/admin/mapsManagement/store";
import { useOauthStore } from "@/store/oauth/store";
import { mdiFile, mdiPencil } from "@mdi/js";

export default defineComponent({
  name: "AdminMaps",
  components: {
    EditMap,
    EditMapFiles,
  },
  setup() {
    const oauthStore = useOauthStore();
    const mapsManagementStore = useMapsManagementStore();

    const search = ref<string>("");
    const editedMap = ref<Map>({} as Map);
    const isEditOpen = ref<boolean>(false);
    const isEditFilesOpen = ref<boolean>(false);
    const isAddDialog = ref<boolean>(false);

    const maps = computed<Map[]>(() => mapsManagementStore.maps);
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
      editedMap.value = map;
    }

    function configureMapFiles(map: Map): void {
      isAddDialog.value = false;
      isEditFilesOpen.value = true;
      editedMap.value = map;
    }

    function closeEdit(): void {
      isAddDialog.value = false;
      isEditOpen.value = false;
    }

    function closeEditFiles(): void {
      isEditFilesOpen.value = false;
    }

    async function saveMap(map: Map): Promise<void> {
      try {
        if (isAddDialog.value) {
          await mapsManagementStore.createMap(map);
        } else {
          await mapsManagementStore.updateMap(map);
        }
        closeEdit();
      } catch (err) {
        err ? alert(err) : alert("Error trying to save map.");
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
        text: "File",
        value: "path",
        sortable: false,
      },
      {
        text: "Actions",
        value: "actions",
        sortable: false,
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
    };
  },
});
</script>
