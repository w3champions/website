import { PlayerOverview } from "@/store/ranking/types";

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
  modifiedProxies: ProxySettings;
  proxyModified: boolean;
  globallyMutedPlayers: GloballyMutedPlayer[];
};

export type AdminPlayerManagementState = {
  managedBattleTag: string;
  allSpecialPortraits: PortraitDefinition[];
  searchedPlayerSpecialPortraits: number[];
  portraitDefinitionGroups: PortraitDefinitionGroup[];
};

export interface ChangePortraitsCommand {
  battleTags: string[];
  portraitIds: number[];
  mouseover?: string;
}

export type ChangePortraitsDto = {
  BnetTags: string[];
  Portraits: number[];
  Tooltip?: string;
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
  gameModes: number[];
  isIpBan: boolean;
  banReason: string;
}

export interface NavigationItem {
  key?: string;
  title: string;
  icon?: string;
  component?: string;
  items?: Array<NavigationItem>;
}

export interface QueueData {
  gameMode: number;
  snapshot: QueuedPlayer[];
}

export interface ProxySettings {
  nodeOverrides: string[];
  automaticNodeOverrides: string[];
  _id?: string;
  _created_at?: string;
  _updated_at?: string;
}

export interface GlobalMute {
  battleTag: string;
  expiresAt: string | null;
}

export interface GloballyMutedPlayer extends GlobalMute {
  id: string;
}

export interface Proxy {
  id: string;
  nodeId: number;
}

export interface QueuedPlayer {
  battleTag: string;
  mmr: number;
  rd: number;
  quantile: number;
  activityQuantile: number;
  queueTime: number;
  isFloConnected: boolean;
  location: string;
  serverOption: string;
}

export type PortraitDefinition = {
  id: string;
  groups: string[];
};

export type PortraitDefinitionGroup = {
  group: string;
  portraitIds: number[];
};

export type PortraitDefinitionDTO = {
  ids: number[];
  groups?: string[];
};

export type SearchedPlayer = {
  gameMode: number;
  player: PlayerOverview;
};

export type OverridesList = {
  overrides: string[];
  isAutomatic: boolean;
};
