import { PlayerOverview } from "@/store/ranking/types";
import { EChatScope } from "../common/typings";
import { EColors } from "../typings";
import { PlayerProfile } from "@/store/player/types";

export type AdminState = {
  total: number;
  players: BannedPlayer[];
  queuedata: QueueData[];
  availableProxies: Proxy[];
  searchedPlayers: PlayerProfile[];
  proxiesSetForSearchedPlayer: ProxySettings;
  searchedBattletag: string;
  modifiedProxies: ProxySettings;
  proxyModified: boolean;
  globallyMutedPlayers: GloballyMutedPlayer[];
  banValidationError: string;
  loungeMutedPlayers: LoungeMuteResponse[]
};

export type AdminPlayerManagementState = {
  managedBattleTag: string;
  allSpecialPortraits: PortraitDefinition[];
  searchedPlayerSpecialPortraits: number[];
  portraitDefinitionGroups: PortraitDefinitionGroup[];
};

export type AdminReplayManagementState = {
  chatLog: ReplayChatLog;
};

export interface ChangePortraitsCommand {
  battleTags: string[];
  portraitIds: number[];
  mouseover?: string;
}

export interface ChangePortraitsDto {
  BnetTags: string[];
  Portraits: number[];
  Tooltip?: string;
}

export interface BannedPlayer {
  battleTag: string;
  endDate: string;
  isOnlyChatBan: boolean;
  gameModes: number[];
  isIpBan: boolean;
  banReason: string;
  smurfs: string[];
  banInsertDate: string;
  author: string;
}

export interface BannedPlayersResponse {
  total: number;
  players: BannedPlayer[];
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

export interface LoungeMute {
  battleTag: string;
  author: string;
  endDate: string;
}

export interface LoungeMuteResponse extends LoungeMute {
  insertDate: string;
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

export type ReplayChatLog = {
  players: ReplayPlayer[];
  messages: ReplayMessage[];
};

export type ReplayPlayer = {
  id: number;
  name: string;
  team: number;
  color: EColors;
};

export type ReplayMessage = {
  fromPlayer: number;
  scope: ReplayMessageScope;
  content: string;
};

export type ReplayMessageScope = {
  type: EChatScope;
  id: number | null;
};
