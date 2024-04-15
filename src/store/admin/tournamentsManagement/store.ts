import { ITournament, ITournamentFloNode, ITournamentPlayer } from "@/store/tournaments/types";
import { useOauthStore } from "@/store/oauth/store";
import TournamentsService from "@/services/TournamentsService";
import { defineStore } from "pinia";
import { AdminTournamentsState } from "@/store/admin/tournamentsManagement/types";

export const useTournamentsManagementStore = defineStore("tournamentsManagement", {
  state: (): AdminTournamentsState => ({
    upcomingTournament: {} as ITournament,
    isLoading: false,
    floNodes: [] as ITournamentFloNode[],
  }),
  actions: {
    async loadUpcomingTournament(): Promise<void> {
      const data = await TournamentsService.getUpcomingTournament();
      this.SET_UPCOMING_TOURNAMENT(data.tournament);
    },
    async registerPlayer(player: ITournamentPlayer): Promise<boolean> {
      const oauthStore = useOauthStore();
      const token = oauthStore.token;
      this.SET_IS_LOADING(true);
      const registered = await TournamentsService.registerPlayer(this.upcomingTournament.id, player, token);
      this.SET_IS_LOADING(false);
      return registered;
    },
    async unregisterPlayer(battleTag: string): Promise<boolean> {
      const oauthStore = useOauthStore();
      const token = oauthStore.token;
      this.SET_IS_LOADING(true);
      const registered = await TournamentsService.unregisterPlayer(this.upcomingTournament.id, battleTag, token);
      this.SET_IS_LOADING(false);
      return registered;
    },
    async createTournament(tournament: ITournament): Promise<boolean> {
      const oauthStore = useOauthStore();
      const token = oauthStore.token;
      this.SET_IS_LOADING(true);
      const created = await TournamentsService.createTournament(tournament, token);
      this.SET_IS_LOADING(false);
      return created;
    },
    async updateTournament(tournament: ITournament): Promise<boolean> {
      const oauthStore = useOauthStore();
      const token = oauthStore.token;
      this.SET_IS_LOADING(true);
      const updated = await TournamentsService.updateTournament(tournament, token);
      this.SET_IS_LOADING(false);
      return updated;
    },
    async loadEnabledFloNodes(): Promise<void> {
      if (this.floNodes.length !== 0) return;
      const floNodes = await TournamentsService.getEnabledFloNodes();
      this.SET_FLO_NODES(floNodes);
    },
    SET_UPCOMING_TOURNAMENT(tournament: ITournament): void {
      this.upcomingTournament = tournament;
    },
    SET_IS_LOADING(isLoading: boolean): void {
      this.isLoading = isLoading;
    },
    SET_FLO_NODES(floNodes: ITournamentFloNode[]): void {
      this.floNodes = floNodes;
    }
  },
});
