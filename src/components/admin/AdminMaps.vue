<template>
  <div>
    <v-card-title class="pt-3">
      Manage Maps
    </v-card-title>
    <v-container style="max-width: 1350px;">
      <v-card class="pa-md-4">
        <div class="d-flex align-center">
          <v-btn color="primary" class="mr-2 text-w3-race-bg" @click="addMap">New map</v-btn>
          <!-- No text-w3-race-bg here: that colour is near-black in the dark themes,
               which left black text on the dark grey secondary. Vuetify's computed
               on-secondary reads in every theme. -->
          <v-btn color="secondary" @click="openBulkUpload">Bulk Upload</v-btn>
        </div>
        <v-dialog v-if="isEditOpen" v-model="isEditOpen" max-width="800px" scrollable>
          <edit-map
            :map="editedMap"
            :isAddDialog="isAddDialog"
            :categories="categories"
            @cancel="closeEdit"
            @save="saveMap($event)"
          />
        </v-dialog>

        <v-dialog v-if="isEditFilesOpen" v-model="isEditFilesOpen" max-width="800px" scrollable>
          <edit-map-files :map="editedMap" @cancel="closeEditFiles" @selected="mapFileSelected" />
        </v-dialog>

        <v-dialog v-if="isBulkUploadOpen" v-model="isBulkUploadOpen" max-width="1000px" scrollable>
          <bulk-map-upload @cancel="closeBulkUpload" @completed="handleBulkUploadCompleted" />
        </v-dialog>

        <v-row class="pt-2 px-1" align="center">
          <v-col cols="12" sm="6" md="3">
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
          <v-col cols="12" sm="6" md="2">
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
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="adminMapsFilters.statuses"
              :items="statusOptions"
              label="Status"
              multiple
              clearable
              hide-details
              variant="underlined"
              color="primary"
            >
              <!-- Same chips as the table's Status column, so the filter reads as
                   the thing it filters. -->
              <template v-slot:selection="{ item }">
                <v-chip size="small" variant="flat" :color="statusColor(item.value)" class="mr-1">
                  {{ item.title }}
                </v-chip>
              </template>
              <template v-slot:item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps" title="">
                  <v-chip size="small" variant="flat" :color="statusColor(item.value)">
                    {{ item.title }}
                  </v-chip>
                </v-list-item>
              </template>
            </v-select>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-switch
              v-model="adminMapsFilters.onlyMissingFile"
              label="Only maps without a file"
              hide-details
              density="compact"
              class="text-medium-emphasis flex-grow-0 ml-md-4"
              color="primary"
            />
            <!-- Self-provided maps are hidden by default: there can be a lot of
                 them and they are not part of the curated catalogue. Bound to
                 the store's flag, not mirrored: the store rolls it back when the
                 reload behind it fails, and the checkbox has to show that. -->
            <v-checkbox
              :model-value="includeTemporary"
              label="Show temporary maps"
              hide-details
              density="compact"
              :disabled="loadingTemporary"
              class="text-medium-emphasis flex-grow-0 ml-md-4"
              color="primary"
              @update:model-value="onIncludeTemporaryChanged"
            />
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
            <div class="d-flex align-center ga-1 flex-wrap">
              <!-- variant="flat" so the chip keeps its solid colour and on-colour text;
                   the default tonal variant washes out on the light themes. A chip is
                   not focusable, so one whose tooltip says something gets a tabindex:
                   VTooltip also opens on keyboard focus, the only way a keyboard user
                   can read it. -->
              <v-tooltip
                location="top"
                content-class="w3-tooltip elevation-1"
                :text="statusTooltip(item)"
                :disabled="!statusTooltip(item)"
              >
                <template v-slot:activator="{ props }">
                  <v-chip
                    v-bind="props"
                    size="small"
                    variant="flat"
                    :color="mapStatus(item).color"
                    :tabindex="statusTooltip(item) ? 0 : undefined"
                  >
                    {{ mapStatus(item).label }}
                  </v-chip>
                </template>
              </v-tooltip>
              <!-- A self-provided map is not part of the catalogue; the chip
                   carries its file state and when it was last played. Focusable
                   like the status chip, since the date is only in the tooltip. -->
              <v-tooltip
                v-if="isTemporaryMap(item)"
                location="top"
                content-class="w3-tooltip elevation-1"
                :text="temporaryTooltip(item)"
              >
                <template v-slot:activator="{ props }">
                  <v-chip v-bind="props" size="small" variant="flat" color="warning" tabindex="0">
                    {{ item.fileState === "deleted" ? "Temporary (file deleted)" : "Temporary" }}
                  </v-chip>
                </template>
              </v-tooltip>
              <!-- Lives beside the state it changes, and away from the actions that
                   open a dialog, where it used to invite misclicks. -->
              <v-tooltip
                location="top"
                content-class="w3-tooltip elevation-1"
                :text="toggleTooltip(item)"
              >
                <!-- The activator is the wrapper, not the button: a disabled v-btn
                     has pointer-events none, so the tooltip would never show on the
                     one row where it explains the most. -->
                <template v-slot:activator="{ props }">
                  <span v-bind="props" class="d-inline-flex">
                    <v-btn
                      :icon="item.disabled ? mdiEyeOutline : mdiEyeOffOutline"
                      :color="item.disabled ? 'success' : undefined"
                      :loading="togglingMapId === item.id"
                      :disabled="togglingMapId !== null || isLockedByLadder(item) || isReadOnly(item)"
                      variant="text"
                      size="small"
                      :aria-label="toggleTooltip(item)"
                      @click="toggleMapDisabled(item)"
                    />
                  </span>
                </template>
              </v-tooltip>
            </div>
          </template>
          <template v-slot:[`item.path`]="{ item }">
            <!-- A swept temporary map keeps its `gameMap.path` on purpose - it's
                 the restore key if the map is ever reattached - but showing that
                 path here would read as a file that's still there. Say so instead;
                 the stored path itself is untouched. -->
            <span v-if="isTemporaryMap(item) && item.fileState === 'deleted'" class="text-medium-emphasis">
              File expired and deleted
            </span>
            <span v-else-if="getMapPath(item)">{{ getMapPath(item) }}</span>
            <span v-else class="text-medium-emphasis">No file selected</span>
          </template>
          <template v-slot:[`item.uploader`]="{ item }">
            <span v-if="item.uploader">{{ item.uploader }}</span>
            <span v-else class="text-medium-emphasis">Unknown</span>
          </template>
          <template v-slot:[`item.actions`]="{ item, internalItem, isExpanded, toggleExpand }">
            <div class="d-flex align-center">
              <!-- The matchmaking service rejects PUT /maps/:id for a temporary
                   map, and its file is owned by the uploader, not by an admin. -->
              <template v-if="!isReadOnly(item)">
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
              </template>
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
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from "vue";
import type { AdminMapsFilters, Map, MapFileData, MapStatus } from "@/store/admin/mapsManagement/types";
import EditMap from "./maps/EditMap.vue";
import EditMapFiles from "./maps/EditMapFiles.vue";
import BulkMapUpload from "./maps/BulkMapUpload.vue";
import MapFileDetails from "./maps/MapFileDetails.vue";
import { useMapsManagementStore } from "@/store/admin/mapsManagement/store";
import { isTemporaryMap } from "@/services/maps/mapsRequest";
import { useOauthStore } from "@/store/oauth/store";
import { useRankingStore } from "@/store/ranking/store";
import { loadActiveGameModes } from "@/composables/GameModesMixin";
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
    const rankingStore = useRankingStore();

    const search = ref<string>("");
    const editedMap = ref<Map>({} as Map);
    const isEditOpen = ref<boolean>(false);
    const isEditFilesOpen = ref<boolean>(false);
    const isAddDialog = ref<boolean>(false);
    const isBulkUploadOpen = ref<boolean>(false);

    // Nothing selected means no status filter, the same as selecting all three.
    const statusOptions: MapStatus[] = ["Ladder", "Custom", "Disabled"];
    const adminMapsFilters = ref<AdminMapsFilters>({
      statuses: [],
      category: null,
      onlyMissingFile: false,
    });

    const snackbar = ref<boolean>(false);
    const snackbarText = ref<string>("");
    const snackbarColor = ref<string>("success");
    const togglingMapId = ref<number | null>(null);
    // The store's flag always describes the rows on screen (it reverts itself
    // when a reload fails), so the checkbox reads it rather than keeping a copy.
    const includeTemporary = computed<boolean>(() => mapsManagementStore.includeTemporary);
    // Guards against an out-of-order reload leaving the checkbox and the table
    // disagreeing while its own toggle is still in flight.
    const loadingTemporary = ref<boolean>(false);

    const maps = computed<Map[]>(() => {
      const filters = adminMapsFilters.value;
      return mapsManagementStore.maps.filter((map) => {
        if (filters.statuses.length > 0 && !filters.statuses.includes(mapStatus(map).label)) return false;
        if (filters.category && map.category !== filters.category) return false;
        if (filters.onlyMissingFile && map.gameMap?.path) return false;
        return true;
      });
    });

    // The active ladder modes carry their map pools, so a map's role is derivable
    // rather than another thing to keep in sync by hand.
    const ladderModesByMapId = computed<Record<number, string[]>>(() => {
      const modesByMap: Record<number, string[]> = {};
      for (const mode of rankingStore.activeModes) {
        for (const map of mode.maps ?? []) {
          (modesByMap[map.id] ??= []).push(mode.name);
        }
      }
      return modesByMap;
    });

    function ladderModes(map: Map): string[] {
      return ladderModesByMapId.value[map.id] ?? [];
    }

    const STATUS_COLORS: Record<MapStatus, string> = {
      Ladder: "info",
      Custom: "secondary",
      Disabled: "error",
    };

    function statusColor(status: MapStatus): string {
      return STATUS_COLORS[status];
    }

    function mapStatus(map: Map): { label: MapStatus; color: string } {
      const label: MapStatus = map.disabled ? "Disabled" : ladderModes(map).length > 0 ? "Ladder" : "Custom";
      return { label, color: STATUS_COLORS[label] };
    }

    function statusTooltip(map: Map): string {
      const modes = ladderModes(map);
      if (modes.length === 0) return "";
      return `In the active ladder pool: ${modes.join(", ")}`;
    }

    // The matchmaking service refuses to disable a map that a ladder mode is using,
    // so the action is held rather than offered and then rejected.
    function isLockedByLadder(map: Map): boolean {
      return !map.disabled && ladderModes(map).length > 0;
    }

    // Named for what it means on this page - a temporary map's row is shown
    // and nothing more - over the shared `isTemporaryMap` it wraps.
    function isReadOnly(map: Map): boolean {
      return isTemporaryMap(map);
    }

    function toggleTooltip(map: Map): string {
      if (isReadOnly(map)) return "Temporary maps can't be edited";
      if (isLockedByLadder(map)) return "Can't disable a map that is in an active ladder pool";
      return map.disabled ? "Enable map" : "Disable map";
    }

    function formatDate(epochMs: number): string {
      return new Date(epochMs).toLocaleString();
    }

    function temporaryTooltip(map: Map): string {
      const file = map.fileState === "deleted"
        ? "its file has expired and been deleted"
        : "its file is stored";
      const hosted = map.lastHostedAt
        ? `last hosted ${formatDate(map.lastHostedAt)}`
        : "never hosted";
      return `Self-provided map: ${file}; ${hosted}.`;
    }

    // VCheckbox emits `unknown` on @update:model-value, not `boolean | null`.
    // On failure the store has already put the flag back; only the report is
    // the page's.
    async function onIncludeTemporaryChanged(value: unknown): Promise<void> {
      loadingTemporary.value = true;
      try {
        await mapsManagementStore.setIncludeTemporary(value === true);
      } catch (err) {
        showSnackbar(err instanceof Error ? err.message : "Error trying to load maps.", "error");
      } finally {
        loadingTemporary.value = false;
      }
    }

    const categories = computed<string[]>(() =>
      [...new Set(mapsManagementStore.maps.map((map) => map.category).filter((c): c is string => !!c))]
        .sort((a, b) => a.localeCompare(b))
    );

    // A selected category can vanish from the list - unticking "Show temporary
    // maps" drops the categories only temporary maps have, and an edit can empty
    // one - which would leave an empty table under a filter still on display.
    watch(categories, (list) => {
      const category = adminMapsFilters.value.category;
      if (category && !list.includes(category)) {
        adminMapsFilters.value = { ...adminMapsFilters.value, category: null };
      }
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

    // The dialog stays open so its per-file confirmation remains visible. It has
    // already tried to reload the maps; a failed refresh is reported inside the
    // dialog, so the table behind it may lag until the next action.
    function handleBulkUploadCompleted(count: number): void {
      showSnackbar(`Successfully selected ${count} map${count === 1 ? "" : "s"}!`, "success");
    }

    function showSnackbar(text: string, color: string): void {
      snackbarText.value = text;
      snackbarColor.value = color;
      snackbar.value = true;
    }

    // Runs once a write has landed, so a failed refresh is reported as exactly
    // that - never as a failed write - and next to the write's confirmation rather
    // than instead of it. One snackbar either way, since it has a single slot.
    // Same split as BulkMapUpload's selectAll.
    async function reloadAfterWrite(confirmation?: string): Promise<void> {
      try {
        await mapsManagementStore.loadMaps();
      } catch (err) {
        const refreshError = err instanceof Error
          ? `The maps table could not be refreshed: ${err.message}`
          : "The maps table could not be refreshed.";
        showSnackbar(confirmation ? `${confirmation} ${refreshError}` : refreshError, "warning");
        return;
      }
      if (confirmation) {
        showSnackbar(confirmation, "success");
      }
    }

    // `confirmation` is shown once the write lands. The edit dialog passes none:
    // the dialog closing already says the save worked.
    async function saveMap(map: Map, confirmation?: string): Promise<void> {
      try {
        if (isAddDialog.value) {
          await mapsManagementStore.createMap(map);
        } else {
          await mapsManagementStore.updateMap(map);
        }
      } catch(err) {
        showSnackbar(err instanceof Error ? err.message : "Error trying to save map.", "error");
        return;
      }
      closeEdit();
      await reloadAfterWrite(confirmation);
    }

    async function mapFileSelected(e: { map: Map; file: MapFileData }): Promise<void> {
      const map = e.map;
      const file = e.file;

      map.gameMap = file.metaData;
      map.gameMap.path = `maps\\${file.filePath.replaceAll("/", "\\")}`;

      await saveMap(map, `Selected ${getMapPath(map)} for ${map.name}.`);
      closeEditFiles();
    }

    // Flipping a map's availability is the most common edit, so it gets a row
    // action instead of a trip through the edit dialog.
    async function toggleMapDisabled(map: Map): Promise<void> {
      togglingMapId.value = map.id;
      try {
        await mapsManagementStore.updateMap({ ...map, disabled: !map.disabled });
      } catch(err) {
        showSnackbar(err instanceof Error ? err.message : "Error trying to update map.", "error");
        togglingMapId.value = null;
        return;
      }
      // Still held while the table refreshes, so no row is toggled from a stale
      // value. reloadAfterWrite reports its own failure and never rejects.
      await reloadAfterWrite(`${map.name} is now ${map.disabled ? "enabled" : "disabled"}.`);
      togglingMapId.value = null;
    }

    function createDefaultMap(): Map {
      // A map with no file is not playable anyway - the matchmaking service drops
      // maps without a gameMap from its in-game list - so a new one starts disabled
      // and is enabled deliberately once a file has been selected.
      const map: Map = {
        id: -1,
        name: "",
        category: "",
        maxTeams: 2,
        mappedForces: [],
        disabled: true,
      };

      return map;
    }

    watch(isAdmin, init);

    async function init(): Promise<void> {
      if (!isAdmin.value) return;
      // allSettled rather than all: a failed maps load must not hide whatever
      // loadActiveGameModes() found, and vice versa - both failures are
      // reported, since a silently stale activeModes list would leave
      // isLockedByLadder() guarding against data that is no longer current.
      const [mapsResult, gameModesResult] = await Promise.allSettled([
        mapsManagementStore.loadMaps(),
        loadActiveGameModes(),
      ]);
      const errors: string[] = [];
      if (mapsResult.status === "rejected") {
        const err = mapsResult.reason;
        errors.push(err instanceof Error ? err.message : "Error trying to load maps.");
      }
      if (gameModesResult.status === "rejected") {
        errors.push("Error trying to load active game modes.");
      }
      if (errors.length > 0) {
        showSnackbar(errors.join(" "), "error");
      }
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    // "Show temporary maps" is an explicit opt-in for this page, not a
    // standing preference, so it (and the cached rows fetched under it) must
    // not survive the page closing. onUnmounted, not a watch(isAdmin, ...)
    // here: the parent gates this component on v-if="isAdmin", so the parent
    // unmounts and stops this component's watchers before one could fire.
    onUnmounted(() => {
      mapsManagementStore.reset();
    });

    // The table is laid out with fixed widths (see the style block): every column but
    // "File" is sized here, so expanding a row cannot re-measure and shift the columns.
    const headers: DataTableHeader[] = [
      { title: "ID", value: "id", sortable: true, width: 80 },
      { title: "Map name", value: "name", sortable: true, width: 220 },
      { title: "Category", value: "category", sortable: true, width: 150 },
      { title: "Uploader", value: "uploader", sortable: true, width: 170 },
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
      statusOptions,
      statusColor,
      mapStatus,
      statusTooltip,
      isLockedByLadder,
      toggleTooltip,
      togglingMapId,
      toggleMapDisabled,
      includeTemporary,
      loadingTemporary,
      onIncludeTemporaryChanged,
      isReadOnly,
      isTemporaryMap,
      temporaryTooltip,
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
  min-width: 1070px;
}

.maps-table :deep(td) {
  word-break: break-word;
}
</style>
