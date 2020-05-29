export interface ClanState {
  selectedClan: Clan;
  playersClan: Clan;
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
