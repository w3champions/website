import { ITournament, TournamentsState } from "./types";
import { Map } from "@/store/admin/mapsManagement/types";
import TournamentsService from "@/services/TournamentsService";
import MapsService from "@/services/MapsService";
import { defineStore } from "pinia";

export const useTournamentsStore = defineStore("tournaments", {
  state: (): TournamentsState => ({
    // loaded: false,
    tournaments: [],
    maps: [],
    activeMaps: [],
  }),
  actions: {
    async retrieveTournaments() {
      if (this.tournaments.length > 0) {
        return;
      }
      const response = await TournamentsService.getTournaments();
      this.SET_TOURNAMENTS(response.tournaments);
    },
    async loadTournamentMaps() {
      if (this.maps.length > 0) {
        return;
      }
      const response = await MapsService.getTournamentMaps(false);
      this.SET_MAPS(response.items);
    },
    async loadActiveTournamentMaps() {
      if (this.activeMaps.length > 0) {
        return;
      }
      const response = await MapsService.getTournamentMaps(true);
      this.SET_ACTIVE_MAPS(response.items);
    },
    SET_TOURNAMENTS(tournaments: ITournament[]): void {
      this.tournaments = tournaments;
    },
    SET_MAPS(maps: Map[]): void {
      this.maps = maps;
    },
    SET_ACTIVE_MAPS(activeMaps: Map[]): void {
      this.activeMaps = activeMaps;
    },
  },
});
