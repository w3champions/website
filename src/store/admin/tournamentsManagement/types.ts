import { ITournament, ITournamentFloNode } from "@/store/tournaments/types";

export interface AdminTournamentsState {
  upcomingTournament: ITournament;
  isLoading: boolean;
  floNodes: ITournamentFloNode[];
}
