import { ITournament } from "@/store/tournaments/types";

export interface AdminTournamentsState {
  upcomingTournament: ITournament;
  isLoading: boolean;
}
