export type AdminState = {
  total: number;
  players: BannedPlayer[];
  news: NewsMessage[];
};

export interface NewsMessage {
  message: string;
  date: string;
  bsonId: string;
}

export interface BannedPlayer {
  battleTag: string;
  endDate: string;
  isIpBan: boolean;
  isOnlyChatBan: boolean;
  banReason: string;
}
