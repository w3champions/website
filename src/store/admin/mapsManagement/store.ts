import type { AdminMapsState, GetMapsResponse, Map, MapFileData } from "./types";
import { useOauthStore } from "@/store/oauth/store";
import MapsService from "@/services/MapsService";
import { defineStore } from "pinia";

export const useMapsManagementStore = defineStore("mapsManagement", {
  state: (): AdminMapsState => ({
    totalMaps: 0,
    maps: [] as Map[],
    mapsFilter: undefined,
    mapFiles: [] as MapFileData[],
  }),
  actions: {
    async loadMaps(filter?: string) {
      const oauthStore = useOauthStore();
      const searchMapsResponse = await MapsService.getAllMaps(oauthStore.token, filter);
      this.SET_MAPS(searchMapsResponse);
      this.SET_FILTER(filter);
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
    SET_MAP_FILES(mapFiles: MapFileData[]) {
      this.mapFiles = mapFiles || [];
    },
  },
});
