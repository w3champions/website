<template>
  <div>
    <v-card-title class="pt-3">
      Manage Maps
    </v-card-title>
    <v-container style="max-width: 1350px;">
      <v-card class="pa-md-4">
        <div class="d-flex align-center">
          <v-btn color="primary" class="mr-2 text-w3-race-bg" @click="addMap">Add map</v-btn>
          <v-btn color="secondary" class="text-w3-race-bg" @click="openBulkUpload">Bulk Upload</v-btn>
        </div>
        <v-dialog v-if="isEditOpen" v-model="isEditOpen" max-width="800px" scrollable>
          <edit-map
            :map="editedMap"
            :isAddDialog="isAddDialog"
            :categories="categories"
            @cancel="closeEdit"
            @save="saveMap"
          />
        </v-dialog>

        <v-dialog v-if="isEditFilesOpen" v-model="isEditFilesOpen" max-width="800px" scrollable>
          <edit-map-files :map="editedMap" @cancel="closeEditFiles" @selected="mapFileSelected" />
        </v-dialog>

        <v-dialog v-if="isBulkUploadOpen" v-model="isBulkUploadOpen" max-width="1000px" scrollable>
          <bulk-map-upload @cancel="closeBulkUpload" @completed="handleBulkUploadCompleted" />
        </v-dialog>

        <v-row class="pt-2 px-1" align="center" dense>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="search"
              label="Search"
              :prepend-inner-icon="mdiMagnify"
              variant="underlined"
              color="primary"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-autocomplete
              v-model="adminMapsFilters.category"
              :items="categories"
              label="Category"
              variant="underlined"
              color="primary"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" md="5">
            <div class="d-flex flex-wrap ga-4">
              <v-switch
                v-model="adminMapsFilters.hideDisabled"
                label="Hide disabled maps"
                hide-details
                density="compact"
                class="text-medium-emphasis flex-grow-0"
                color="primary"
              />
              <v-switch
                v-model="adminMapsFilters.onlyMissingFile"
                label="Only maps without a file"
                hide-details
                density="compact"
                class="text-medium-emphasis flex-grow-0"
                color="primary"
              />
            </div>
          </v-col>
        </v-row>
        <v-data-table
          :headers="headers"
          :items="maps"
          :items-per-page="10"
          :footer-props="{ itemsPerPageOptions: [10, 25, 50, -1] }"
          :search="search"
          class="elevation-1 maps-table"
          item-value="id"
          :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
        >
          <template v-slot:[`item.disabled`]="{ item }">
            <div class="d-flex align-center ga-1">
              <!-- variant="flat" so the chip keeps its solid colour and on-colour text;
                   the default tonal variant washes out on the light themes. -->
              <v-chip size="small" variant="flat" :color="item.disabled ? 'error' : 'success'">
                {{ item.disabled ? "Disabled" : "Enabled" }}
              </v-chip>
              <!-- Lives beside the state it changes, and away from the actions that
                   open a dialog, where it used to invite misclicks. -->
              <v-tooltip
                location="top"
                content-class="w3-tooltip elevation-1"
                :text="item.disabled ? 'Enable map' : 'Disable map'"
              >
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    :icon="item.disabled ? mdiEyeOutline : mdiEyeOffOutline"
                    :color="item.disabled ? 'success' : undefined"
                    :loading="togglingMapId === item.id"
                    :disabled="togglingMapId !== null"
                    variant="text"
                    size="small"
                    :aria-label="item.disabled ? 'Enable map' : 'Disable map'"
                    @click="toggleMapDisabled(item)"
                  />
                </template>
              </v-tooltip>
            </div>
          </template>
          <template v-slot:[`item.path`]="{ item }">
            <span v-if="getMapPath(item)">{{ getMapPath(item) }}</span>
            <span v-else class="text-medium-emphasis">No file selected</span>
          </template>
          <template v-slot:[`item.actions`]="{ item, internalItem, isExpanded, toggleExpand }">
            <div class="d-flex align-center">
              <v-tooltip location="top" content-class="w3-tooltip elevation-1" text="Edit map">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    :icon="mdiPencil"
                    variant="text"
                    size="small"
                    aria-label="Edit map"
                    @click="configureMap(item)"
                  />
                </template>
              </v-tooltip>
              <v-tooltip location="top" content-class="w3-tooltip elevation-1" text="Manage map files">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    :icon="mdiFile"
                    variant="text"
                    size="small"
                    aria-label="Manage map files"
                    @click="configureMapFiles(item)"
                  />
                </template>
              </v-tooltip>
              <!-- Rendered here rather than through show-expand, which puts its
                   toggle in a column of its own, detached from the other actions. -->
              <v-tooltip
                location="top"
                content-class="w3-tooltip elevation-1"
                :text="isExpanded(internalItem) ? 'Hide map file details' : 'Show map file details'"
              >
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    :icon="isExpanded(internalItem) ? mdiChevronUp : mdiChevronDown"
                    variant="text"
                    size="small"
                    :aria-label="isExpanded(internalItem) ? 'Hide map file details' : 'Show map file details'"
                    @click="toggleExpand(internalItem)"
                  />
                </template>
              </v-tooltip>
            </div>
          </template>

          <!-- What the map's selected file actually contains, without opening a dialog. -->
          <template v-slot:expanded-row="{ columns, item }">
            <tr>
              <td :colspan="columns.length" class="py-3">
                <map-file-details :game-map="item.gameMap" :map="item" :collapsible="false" />
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card>
    </v-container>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import type { AdminMapsFilters, Map, MapFileData } from "@/store/admin/mapsManagement/types";
import EditMap from "./maps/EditMap.vue";
import EditMapFiles from "./maps/EditMapFiles.vue";
import BulkMapUpload from "./maps/BulkMapUpload.vue";
import MapFileDetails from "./maps/MapFileDetails.vue";
import { useMapsManagementStore } from "@/store/admin/mapsManagement/store";
import { useOauthStore } from "@/store/oauth/store";
import { mdiChevronDown, mdiChevronUp, mdiEyeOffOutline, mdiEyeOutline, mdiFile, mdiMagnify, mdiPencil } from "@mdi/js";
import type { DataTableHeader } from "vuetify";

export default defineComponent({
  name: "AdminMaps",
  components: {
    EditMap,
    EditMapFiles,
    BulkMapUpload,
    MapFileDetails,
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

    const adminMapsFilters = ref<AdminMapsFilters>({
      hideDisabled: false,
      category: null,
      onlyMissingFile: false,
    });

    const snackbar = ref<boolean>(false);
    const snackbarText = ref<string>("");
    const snackbarColor = ref<string>("success");
    const togglingMapId = ref<number | null>(null);

    const maps = computed<Map[]>(() => {
      const filters = adminMapsFilters.value;
      return mapsManagementStore.maps.filter((map) => {
        if (filters.hideDisabled && map.disabled) return false;
        if (filters.category && map.category !== filters.category) return false;
        if (filters.onlyMissingFile && map.gameMap?.path) return false;
        return true;
      });
    });

    const categories = computed<string[]>(() =>
      [...new Set(mapsManagementStore.maps.map((map) => map.category).filter((c): c is string => !!c))]
        .sort((a, b) => a.localeCompare(b))
    );

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

    // Deep clone: mappedForces and gameMap are nested, so a shallow copy would let
    // the dialog mutate the store's row even when the edit is cancelled.
    function cloneMap(map: Map): Map {
      return JSON.parse(JSON.stringify(map));
    }

    function configureMap(map: Map): void {
      isAddDialog.value = false;
      isEditOpen.value = true;
      editedMap.value = cloneMap(map);
    }

    function configureMapFiles(map: Map): void {
      isAddDialog.value = false;
      isEditFilesOpen.value = true;
      editedMap.value = cloneMap(map);
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

    // The dialog stays open so its per-file confirmation remains visible; it already
    // reloaded the maps, so the table behind it is up to date.
    function handleBulkUploadCompleted(count: number): void {
      showSnackbar(`Successfully selected ${count} map${count === 1 ? "" : "s"}!`, "success");
    }

    function showSnackbar(text: string, color: string): void {
      snackbarText.value = text;
      snackbarColor.value = color;
      snackbar.value = true;
    }

    async function saveMap(map: Map): Promise<boolean> {
      try {
        if (isAddDialog.value) {
          await mapsManagementStore.createMap(map);
        } else {
          await mapsManagementStore.updateMap(map);
        }
        closeEdit();
        await mapsManagementStore.loadMaps();
        return true;
      } catch(err) {
        showSnackbar(err instanceof Error ? err.message : "Error trying to save map.", "error");
        return false;
      }
    }

    async function mapFileSelected(e: { map: Map; file: MapFileData }): Promise<void> {
      const map = e.map;
      const file = e.file;

      map.gameMap = file.metaData;
      map.gameMap.path = `maps\\${file.filePath.replaceAll("/", "\\")}`;

      if (await saveMap(map)) {
        showSnackbar(`Selected ${getMapPath(map)} for ${map.name}.`, "success");
      }
      closeEditFiles();
    }

    // Flipping a map's availability is the most common edit, so it gets a row
    // action instead of a trip through the edit dialog.
    async function toggleMapDisabled(map: Map): Promise<void> {
      togglingMapId.value = map.id;
      try {
        await mapsManagementStore.updateMap({ ...map, disabled: !map.disabled });
        await mapsManagementStore.loadMaps();
        showSnackbar(`${map.name} is now ${map.disabled ? "enabled" : "disabled"}.`, "success");
      } catch(err) {
        showSnackbar(err instanceof Error ? err.message : "Error trying to update map.", "error");
      } finally {
        togglingMapId.value = null;
      }
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

    // The table is laid out with fixed widths (see the style block): every column but
    // "File" is sized here, so expanding a row cannot re-measure and shift the columns.
    const headers: DataTableHeader[] = [
      { title: "ID", value: "id", sortable: true, width: 80 },
      { title: "Map name", value: "name", sortable: true, width: 220 },
      { title: "Category", value: "category", sortable: true, width: 150 },
      { title: "Status", value: "disabled", sortable: true, width: 160 },
      { title: "File", value: "path", sortable: false },
      { title: "Actions", value: "actions", sortable: false, width: 150, nowrap: true },
    ];

    return {
      mdiFile,
      mdiPencil,
      mdiMagnify,
      mdiChevronDown,
      mdiChevronUp,
      mdiEyeOutline,
      mdiEyeOffOutline,
      categories,
      togglingMapId,
      toggleMapDisabled,
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
      snackbar,
      snackbarText,
      snackbarColor,
    };
  },
});
</script>

<style lang="scss" scoped>
// With the default auto layout the browser re-measures the columns whenever a row is
// expanded, because the expanded cell spans them all - so the same rows wrap
// differently open than closed. Fixed layout pins the widths from the headers.
.maps-table :deep(table) {
  table-layout: fixed;
  min-width: 900px;
}

.maps-table :deep(td) {
  word-break: break-word;
}
</style>
