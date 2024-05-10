import { PlayerProfile } from "@/store/player/types";

export type PlayerSearchState = {
  searchedPlayers: PlayerProfile[];
  playerSearchModel: string;
};
