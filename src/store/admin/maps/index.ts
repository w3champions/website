import isEmpty from "lodash/isEmpty";
import { moduleActionContext } from "../..";
import { RootState } from "../../typings";
import { ActionContext } from "vuex";
import { AdminMapsState, GetMapsResponse, Map, MapFileData, GetSeasonMapsResponse, SeasonMap } from "./types";

const mod = {
  namespaced: true,
  state: {
    totalMaps: 0 as number,
    maps: [] as Map[],
    mapsFilter: undefined,
    mapFiles: [] as  MapFileData[],
    seasonMaps: [] as SeasonMap[],
  } as AdminMapsState,

  actions: {
    async loadMaps(context: ActionContext<AdminMapsState, RootState>, filter?: string) {
      const { commit, rootGetters, rootState } = moduleActionContext(context, mod);
      const searchMapsResponse = await rootGetters.mapService.getAllMaps(rootState.oauth.token, filter);

      commit.SET_MAPS(searchMapsResponse);
      commit.SET_FILTER(filter);
    },

    async createMap(context: ActionContext<AdminMapsState, RootState>, map: Map) {
      const { dispatch, rootGetters, state, rootState } = moduleActionContext(context, mod);
      await rootGetters.mapService.createMap(rootState.oauth.token, map);
      dispatch.loadMaps(state.mapsFilter);
    },

    async updateMap(context: ActionContext<AdminMapsState, RootState>, map: Map) {
      const { dispatch, rootGetters, state, rootState } = moduleActionContext(context, mod);
      await rootGetters.mapService.updateMap(rootState.oauth.token, map.id, map);
      dispatch.loadMaps(state.mapsFilter);
    },

    async loadMapFiles(context: ActionContext<AdminMapsState, RootState>, mapId: number) {
      const { commit, rootGetters, rootState } = moduleActionContext(context, mod);
      const mapFiles = await rootGetters.mapService.getMapFiles(rootState.oauth.token, mapId);
      commit.SET_MAP_FILES(mapFiles);
    },

    async createMapFile(context: ActionContext<AdminMapsState, RootState>, formData: FormData) {
      const { rootGetters, rootState } = moduleActionContext(context, mod);
      await rootGetters.mapService.createMapFile(rootState.oauth.token, formData);
    },

    async loadMapsForCurrentSeason(context: ActionContext<AdminMapsState, RootState>) {
      const { commit, rootGetters, state } = moduleActionContext(context, mod);

      // Season maps already fetched, skip
      if (!isEmpty(state.seasonMaps)) {
        return;
      }

      const searchMapsResponse = await rootGetters.mapService.getMapsForCurrentSeason();
      commit.SET_SEASON_MAPS(searchMapsResponse);
    },
  },

  mutations: {
    SET_MAPS(state: AdminMapsState, getMapsResponse: GetMapsResponse) {
      state.maps = getMapsResponse?.items ?? [];
      state.totalMaps = getMapsResponse?.total ?? 0;
    },

    SET_FILTER(state: AdminMapsState, filter?: string) {
      state.mapsFilter = filter;
    },

    SET_MAP_FILES(state: AdminMapsState, mapFiles: MapFileData[]) {
      state.mapFiles = mapFiles || [];
    },

    SET_SEASON_MAPS(state: AdminMapsState, getSeasonMapsResponse: GetSeasonMapsResponse) {
      state.seasonMaps = getSeasonMapsResponse?.items ?? [];
    },
  },
} as const;

export default mod;
