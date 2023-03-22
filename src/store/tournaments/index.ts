import { moduleActionContext } from "..";
import { ActionContext } from "vuex";
import { TournamentsState, ITournament } from "./types";
import { RootState } from "../typings";
import { Map } from "../admin/maps/types";
import TournamentsService from "@/services/TournamentsService";
import MapsService from "@/services/MapsService";

const mod = {
  namespaced: true,
  state: {
    loaded: false,
    tournaments: [],
    maps: [],
    activeMaps: [],
  } as TournamentsState,
  actions: {
    async retrieveTournaments(
      context: ActionContext<TournamentsState, RootState>
    ) {
      const { commit, state } = moduleActionContext(context, mod);

      if (state.tournaments.length > 0) {
        return;
      }

      const response = await TournamentsService.getTournaments();
      commit.SET_TOURNAMENTS(response.tournaments);
    },
    async loadTournamentMaps(context: ActionContext<TournamentsState, RootState>) {
      const { commit, state } = moduleActionContext(context, mod);

      if (state.maps.length > 0) {
        return;
      }

      const response = await MapsService.getTournamentMaps(false);
      commit.SET_MAPS(response.items);
    },
    async loadActiveTournamentMaps(context: ActionContext<TournamentsState, RootState>) {
      const { commit, state } = moduleActionContext(context, mod);

      if (state.activeMaps.length > 0) {
        return;
      }

      const response = await MapsService.getTournamentMaps(true);
      commit.SET_ACTIVE_MAPS(response.items);
    },
  },
  mutations: {
    SET_TOURNAMENTS(state: TournamentsState, tournaments: ITournament[]) {
      state.tournaments = tournaments;
    },
    SET_MAPS(state: TournamentsState, maps: Map[]) {
      state.maps = maps;
    },
    SET_ACTIVE_MAPS(state: TournamentsState, activeMaps: Map[]) {
      state.activeMaps = activeMaps;
    },
  },
} as const;

export default mod;
