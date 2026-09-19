import type { AdminMapsState, GetMapsResponse, Map, MapFileData } from "./types";
import { ReloadSequence } from "./reloadSequence";
import { useOauthStore } from "@/store/oauth/store";
import MapsService from "@/services/MapsService";
import { defineStore } from "pinia";

// Reloads overlap - the page's first load, the refresh after a save, an
// enable/disable or a bulk selection, and the "Show temporary maps" opt-in can
// all be in flight at once - and their responses can land in any order. The
// ordering rules live in ReloadSequence; loadMaps applies what it decides. A
// plain module value, not state: nothing renders it.
const reloads = new ReloadSequence();

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
    // Either way `includeTemporary` is left describing the rows on screen.
    async loadMaps(filter?: string) {
      // Read once: the rows a load returns describe the flag it was fetched
      // with, whatever the store says by the time they land.
      const includeTemporary = this.includeTemporary;
      const load = reloads.start(includeTemporary);
      let searchMapsResponse: GetMapsResponse;
      try {
        const oauthStore = useOauthStore();
        searchMapsResponse = await MapsService.getAllMaps(oauthStore.token, filter, includeTemporary);
      } catch (err) {
        const outcome = reloads.failed(load);
        this.SET_INCLUDE_TEMPORARY(outcome.includeTemporary);
        if (!outcome.report) return;
        throw err;
      }
      const outcome = reloads.landed(load);
      this.SET_INCLUDE_TEMPORARY(outcome.includeTemporary);
      if (!outcome.apply) return;
      this.SET_MAPS(searchMapsResponse);
      this.SET_FILTER(filter);
    },
    // Flips the flag and reloads with it. Should that reload fail - or be
    // superseded by a reload that inherited the flag and then fails - loadMaps
    // reverts the flag to the shown rows' and the newest load's caller reports
    // the failure; nothing to roll back here.
    async setIncludeTemporary(includeTemporary: boolean) {
      this.SET_INCLUDE_TEMPORARY(includeTemporary);
      await this.loadMaps(this.mapsFilter);
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
    // includeTemporary is an explicit per-page opt-in, so it must not outlive
    // the page it was ticked on. The reloads sequencer is a module-level
    // singleton that outlives this store's own resets, so it has to be reset
    // alongside it - otherwise a load still in flight from the page that just
    // unmounted could land in whatever reopens next and repaint its table.
    reset() {
      this.$reset();
      reloads.reset();
    },
  },
});
