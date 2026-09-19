import { ITournament, TournamentsState } from "./types";
import { Map } from "@/store/admin/mapsManagement/types";
import TournamentsService from "@/services/TournamentsService";
import MapsService from "@/services/MapsService";
import { defineStore } from "pinia";

export const useTournamentsStore = defineStore("tournaments", {
  state: (): TournamentsState => ({
    tournaments: [],
    tournamentMaps: [],
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
      if (this.tournamentMaps.length > 0) {
        return;
      }
      try {
        const response = await MapsService.getTournamentMaps();
        this.SET_TOURNAMENT_MAPS(response.items);
      } catch {
        // The map list only decorates the tournament view, so a failed read leaves
        // it empty rather than breaking the page - but it must stay an empty list,
        // not the `undefined` an error body used to produce.
        this.SET_TOURNAMENT_MAPS([]);
      }
    },
    SET_TOURNAMENTS(tournaments: ITournament[]): void {
      this.tournaments = tournaments;
    },
    SET_TOURNAMENT_MAPS(tournamentMaps: Map[]): void {
      this.tournamentMaps = tournamentMaps;
    },
  },
});
