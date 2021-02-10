export type AdminState = {
  total: number;
  players: BannedPlayer[];
  news: NewsMessage[];
  tips: LoadingScreenTip[];
  queuedata: QueueData[];
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

export interface QueuedPlayer {
  mmr: number,
  quantiles: QueueQuantiles,
  queueTime: number,
  isFloConnected: boolean;
  playerData: QueuedPlayerData,
}

export interface QueueQuantiles {
  quantile: number,
  activityQuantile: number,
}

export interface QueuedPlayerData {
  battleTag: string,
  floInfo: FloInfo,
  location: string,
  serverOption: string,
}

export interface FloInfo {
  floPings: FloPingData[],
  closestNode: FloClosestServerData,
}

export interface FloPingData {
  nodeId: number,
  currentPing: number,
  avgPing: number,
  lossRate: number,
  pingFilter: number,
}

export interface FloClosestServerData {
  country_id: string,
  id: number,
  location: string,
  name: string,
  isDisabled: boolean,
  isCnOptimized: boolean,
}