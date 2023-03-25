export type LoungeMuteState = {
  loungeMutedPlayers: LoungeMuteResponse[]
};

export interface LoungeMute {
  battleTag: string;
  author: string;
  endDate: string;
}
  
export interface LoungeMuteResponse extends LoungeMute {
  insertDate: string;
}
