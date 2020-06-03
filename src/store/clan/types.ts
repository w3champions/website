import { PlayerProfile } from "@/store/player/types";

export interface ClanState {
  playersClan: Clan;
  searchPlayers: PlayerProfile[];
  clanValidationError: string;
  selectedMemberShip: ClanMembership;
}

export interface ClanMembership {
  battleTag: string;
  clanId: string;
  clanName: string;
  pendingInviteFromClan: string;
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

export enum EClanRole {
  ChiefTain= 2,
  Shaman = 1,
  Member = 0
}
