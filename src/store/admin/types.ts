import { PlayerOverview } from "@/store/ranking/types";
import { EChatScope } from "../common/types";
import { EColors } from "../types";
import { EPermission } from "./permission/types";

export type AdminState = {
  total: number;
  bannedPlayers: BannedPlayer[];
  queuedata: QueueData[];
  availableProxies: Proxy[];
  proxiesSetForSearchedPlayer: ProxySettings;
  searchedBattletag: string;
  modifiedProxies: ProxySettings;
  proxyModified: boolean;
  globallyMutedPlayers: GloballyMutedPlayer[];
  mutesNextId: number | null;
  banValidationError: string;
  showJwtExpiredDialog: boolean;
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
  gameModes: number[];
  isIpBan: boolean;
  banReason: string;
  banInsertDate: string;
  author: string;
}

export interface BannedPlayersResponse {
  total: number;
  players: BannedPlayer[];
}

export interface AdminNavigationItem {
  title: string;
  icon?: string;
  component?: string;
  items?: Array<AdminNavigationItem>;
  permission: EPermission;
  routeName?: string;
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
  author: string;
}

export interface GlobalChatBanResponse {
  globalChatBans: GloballyMutedPlayer[];
  next_id: number;
}

export interface GloballyMutedPlayer extends GlobalMute {
  id: string;
  createdAt: string;
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

// Rewards Management Types

export type Reward = {
  id: string;
  name: string;
  description: string;
  type: RewardType;
  moduleId: string;
  parameters: Record<string, any>;
  duration: RewardDuration | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};

export enum RewardType {
  Undefined = 0,
  Portrait = 1,
  Badge = 2,
  Title = 3,
  Cosmetic = 4,
  Feature = 5,
  Other = 6
}

export type RewardDuration = {
  type: DurationType;
  value: number;
};

export enum DurationType {
  Permanent = 0,
  Days = 1,
  Months = 2,
  Years = 3
}

export type RewardAssignment = {
  id: string;
  userId: string;
  rewardId: string;
  providerId: string;
  providerReference: string;
  eventId?: string;
  status: RewardStatus;
  assignedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  revokedReason?: string;
  metadata: Record<string, any>;
};

export enum RewardStatus {
  Pending = 0,
  Active = 1,
  Expired = 2,
  Revoked = 3,
  Failed = 4
}

export type ProviderConfiguration = {
  id: string;
  providerId: string;
  providerName: string;
  isActive: boolean;
  settings: Record<string, string>;
  productMappings: ProductMapping[];
  createdAt: string;
  updatedAt?: string;
};

export type ProductMapping = {
  id: string;
  productName: string;
  productProviders: ProductProviderPair[];
  rewardIds: string[];
  type: ProductMappingType;
  additionalParameters: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
};

export type ProductProviderPair = {
  providerId: string;
  productId: string;
};

export enum ProductMappingType {
  OneTime = 0,
  Recurring = 1,
  Tiered = 2
}

export type CreateRewardRequest = {
  name: string;
  description: string;
  type: RewardType;
  moduleId: string;
  parameters?: Record<string, any>;
  duration?: RewardDuration;
};

export type UpdateRewardRequest = {
  name?: string;
  description?: string;
  type?: RewardType;
  parameters?: Record<string, any>;
  duration?: RewardDuration;
  isActive?: boolean;
};

export type DriftDetectionResult = {
  success: boolean;
  timestamp: string;
  hasDrift: boolean;
  summary: {
    missingMembers: number;
    extraAssignments: number;
    mismatchedTiers: number;
    totalPatreonMembers: number;
    activePatreonMembers: number;
    totalInternalAssignments: number;
    uniqueInternalUsers: number;
  };
  details: {
    missingMembers: any[];
    extraAssignments: any[];
    mismatchedTiers: any[];
  };
};

// New types for enhanced reward management

export interface PatreonAccountLink {
  id: string;
  battleTag: string;
  patreonUserId: string;
  linkedAt: string;
  lastSyncAt: string | null;
}

export interface PaginatedAssignments {
  assignments: RewardAssignment[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RewardWithAssignments {
  reward: Reward;
  assignments: RewardAssignment[];
  activeCount: number;
  expiredCount: number;
  revokedCount: number;
}

export interface RewardWithAssignmentCounts {
  reward: Reward;
  activeCount: number;
  expiredCount: number;
  revokedCount: number;
  totalCount: number;
  sampleAssignments: RewardAssignment[];
}

export interface PaginatedRewardsWithAssignments {
  rewards: RewardWithAssignmentCounts[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
