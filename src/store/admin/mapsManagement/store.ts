import { AdminMapsState, GetMapsResponse, Map, MapFileData } from "./types";
import { useOauthStore } from "@/store/oauth/store";
import MapsService from "@/services/MapsService";
import { defineStore } from "pinia";

export const useMapsManagementStore = defineStore("mapsManagement", {
  state: (): AdminMapsState => ({
    totalMaps: 0 as number,
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
      await this.loadMaps(this.mapsFilter);
    },
    async updateMap(map: Map) {
      const oauthStore = useOauthStore();
      await MapsService.updateMap(oauthStore.token, map.id, map);
      await this.loadMaps(this.mapsFilter);
    },
    async loadMapFiles(mapId: number) {
      const oauthStore = useOauthStore();
      const mapFiles = await MapsService.getMapFiles(oauthStore.token, mapId);
      this.SET_MAP_FILES(mapFiles);
    },
    async createMapFile(formData: FormData) {
      const oauthStore = useOauthStore();
      await MapsService.createMapFile(oauthStore.token, formData);
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
