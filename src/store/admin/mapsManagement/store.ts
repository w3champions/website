import type { AdminMapsState, GetMapsResponse, Map, MapFileData } from "./types";
import { useOauthStore } from "@/store/oauth/store";
import MapsService from "@/services/MapsService";
import { defineStore } from "pinia";

// Reloads overlap - the page's first load, the refresh after a save, an
// enable/disable or a bulk selection, and the "Show temporary maps" opt-in can
// all be in flight at once - and their responses can land in any order. Plain
// counters, not state: nothing renders them.
//
// `latestLoad` is bumped when a load starts, and only that newest load reports a
// failure. An older load's failure is moot because the newer load refreshes the
// table and reports its own outcome; rejecting would also let
// setIncludeTemporary roll the flag back under a load already using it.
//
// `shownLoad` is the load whose response the table holds. Every response is the
// same list, so an older one still lands while nothing newer has, but it never
// replaces a newer one: the table only moves forward.
let latestLoad = 0;
let shownLoad = 0;

export const useMapsManagementStore = defineStore("mapsManagement", {
  state: (): AdminMapsState => ({
    totalMaps: 0,
    maps: [] as Map[],
    mapsFilter: undefined,
    // Temporary (self-provided) maps are opt-in and off by default. It lives in
    // the store rather than in the page so the zero-argument `loadMaps()` calls
    // that follow every save keep the admin's choice instead of silently
    // dropping the temporary rows from a table that is still showing them.
    includeTemporary: false,
    mapFiles: [] as MapFileData[],
  }),
  actions: {
    // Rejects only while it is the newest load. A load superseded by a later one
    // resolves even if its own request failed: the later load reports instead.
    async loadMaps(filter?: string) {
      const load = ++latestLoad;
      try {
        const oauthStore = useOauthStore();
        const searchMapsResponse = await MapsService.getAllMaps(oauthStore.token, filter, this.includeTemporary);
        if (load < shownLoad) return;
        shownLoad = load;
        this.SET_MAPS(searchMapsResponse);
        this.SET_FILTER(filter);
      } catch (err) {
        if (load !== latestLoad) return;
        throw err;
      }
    },
    async setIncludeTemporary(includeTemporary: boolean) {
      const previous = this.includeTemporary;
      this.SET_INCLUDE_TEMPORARY(includeTemporary);
      try {
        await this.loadMaps(this.mapsFilter);
      } catch (err) {
        // Only the newest load rejects, so no reload started since - which would
        // already be using the new flag - is undercut by this rollback. Leave the
        // flag describing what is actually on screen, then let the page report
        // the failure.
        this.SET_INCLUDE_TEMPORARY(previous);
        throw err;
      }
    },
    async createMap(map: Map) {
      const oauthStore = useOauthStore();
      await MapsService.createMap(oauthStore.token, map);
    },
    async updateMap(map: Map) {
      const oauthStore = useOauthStore();
      await MapsService.updateMap(oauthStore.token, map.id, map);
    },
    async loadMapFiles(mapId: number) {
      const oauthStore = useOauthStore();
      // The list is shared state, so drop the previous map's files first: otherwise
      // they stay on screen, looking like this map's files, until the reply lands.
      this.SET_MAP_FILES([]);
      const mapFiles = await MapsService.getMapFiles(oauthStore.token, mapId);
      this.SET_MAP_FILES(mapFiles);
    },
    // Reads a map's files without touching the shared list, for callers that need
    // several maps' files at once.
    async fetchMapFiles(mapId: number): Promise<MapFileData[]> {
      const oauthStore = useOauthStore();
      return await MapsService.getMapFiles(oauthStore.token, mapId);
    },
    async createMapFile(formData: FormData, onProgress?: (percentUploaded: number) => void) {
      const oauthStore = useOauthStore();
      await MapsService.createMapFile(oauthStore.token, formData, onProgress);
    },
    SET_MAPS(getMapsResponse: GetMapsResponse) {
      this.maps = getMapsResponse?.items ?? [];
      this.totalMaps = getMapsResponse?.total ?? 0;
    },
    SET_FILTER(filter?: string) {
      this.mapsFilter = filter;
    },
    SET_INCLUDE_TEMPORARY(includeTemporary: boolean) {
      this.includeTemporary = includeTemporary;
    },
    SET_MAP_FILES(mapFiles: MapFileData[]) {
      this.mapFiles = mapFiles || [];
    },
  },
});
