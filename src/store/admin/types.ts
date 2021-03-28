export type AdminState = {
  total: number;
  players: BannedPlayer[];
  news: NewsMessage[];
  tips: LoadingScreenTip[];
  queuedata: QueueData[];
  availableProxies: Proxy[];
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