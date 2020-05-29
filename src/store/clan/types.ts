import { PlayerProfile } from "@/store/player/types";

export interface ClanState {
  selectedClan: Clan;
  playersClan: Clan;
  searchPlayers: PlayerProfile[];
  clanValidationError: string;
  loading: boolean;
}

export interface Clan {
  id: string;
  clanName: string;
  chiefTain: string;
  isSuccesfullyFounded: boolean;
  members: string[];
  foundingFathers: string[];
  shamans: string[];
  pendingInvites: string[];
}
