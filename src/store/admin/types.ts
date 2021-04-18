import { PlayerOverview, Ranking } from "@/store/ranking/types";

export type AdminState = {
  total: number;
  players: BannedPlayer[];
  news: NewsMessage[];
  tips: LoadingScreenTip[];
  queuedata: QueueData[];
  availableProxies: Proxy[];
  searchedPlayers: SearchedPlayer[];
  proxiesSetForSearchedPlayer: ProxySettings;
  searchedBattletag: string;
};

export interface NewsMessage {
  message: string;
  date: string;
  bsonId: string;
}

export interface LoadingScreenTip {
  message: string;
  author: string;
  creationDate: string;
  bsonId: string;
}

export interface BannedPlayer {
  battleTag: string;
  endDate: string;
  isOnlyChatBan: boolean;
  isIpBan: boolean;
  banReason: string;
}

export interface NavigationItem {
  key?: string,
  title: string,
  icon?: string,
  component?: string,
  items?: Array<NavigationItem>
}

export interface QueueData {
  gameMode: number,
  snapshot: QueuedPlayer[]
}

export interface ProxySettings {
  nodeOverrides?: Proxy[],
  automaticNodeOverrides?: Proxy[],
}

export interface Proxy {
  id: string,
  nodeId: number,
}

export interface QueuedPlayer {
  battleTag : string,
  mmr: number,
  rd: number,
  quantile: number,
  activityQuantile: number,
  queueTime: number,
  isFloConnected: boolean,
  location: string,
  serverOption: string,
}

export type PlayerInfoForProxy = {
  id: string;
  player: PlayerOverview;
}

export type SearchedPlayer = {
  gameMode: number,
  player: PlayerOverview,
}
;