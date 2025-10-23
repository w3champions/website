import { PlayerOverview } from "@/store/ranking/types";
import { EChatScope } from "../common/types";
import { EColors } from "../types";
import { EPermission } from "./permission/types";
import { LoungeMuteResponse } from "./loungeMute/types";

export type AdminState = {
  total: number;
  bannedPlayers: BannedPlayer[];
  bannedPlayersCount: number;
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
  battleTagModerationStatus: BattleTagModerationMap;
};

export type AdminPlayerManagementState = {
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

export interface BannedPlayersGetRequest {
  page: number;
  itemsPerPage: number;
  sortBy: string;
  sortDirection: boolean | "asc" | "desc" | undefined;
  search: string;
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
  displayId: string;
  moduleId: string;
  // eslint-disable-next-line
  parameters: Record<string, any>;
  duration: RewardDuration | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  assignmentStats?: RewardAssignmentStats;
};

export type RewardAssignmentStats = {
  activeCount: number;
  expiredCount: number;
  revokedCount: number;
  totalCount: number;
};

// Module-related types for dynamic reward configuration

export interface ModuleDefinition {
  moduleId: string;
  moduleName: string;
  description?: string;
  supportsParameters: boolean;
  parameterDefinitions: Record<string, ParameterDefinition>;
}

export interface ParameterDefinition {
  name: string;
  type: string;
  required: boolean;
  description: string;
  // eslint-disable-next-line
  defaultValue?: any;
}

export type RewardDuration = {
  type: DurationType;
  value: number;
};

export enum DurationType {
  Permanent = 0,
  Days = 1,
  Months = 2,
  Years = 3,
}

export type RewardAssignment = {
  id: string;
  assignmentId?: string; // Alias for id in new API response
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
  revocationReason?: string; // New field name in API response
  metadata?: Record<string, string | undefined>;
  // Additional reward details included in new response
  displayId?: string;
  moduleId?: string;
  moduleName?: string;
};

export enum RewardStatus {
  Pending = 0,
  Active = 1,
  Expired = 2,
  Revoked = 3,
  Failed = 4,
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
  // eslint-disable-next-line
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
  Tiered = 2,
}

export type ProductMappingUser = {
  userId: string;
  providerId: string;
  providerProductId: string;
  status: string;
  assignedAt: string;
  lastUpdatedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  providerReference?: string;
  eventType?: string;
};

export type ProductMappingUsersResponse = {
  productMappingId: string;
  productName: string;
  totalUsers: number;
  activeUsers: number;
  users: ProductMappingUser[];
};

export type ReconciliationResult = {
  success: boolean;
  totalUsersAffected: number;
  rewardsAdded: number;
  rewardsRevoked: number;
  errors: string[];
  wasDryRun: boolean;
  userReconciliations?: UserReconciliationEntry[];
};

export type UserReconciliationEntry = {
  userId: string;
  productMappingId: string;
  productMappingName: string;
  actions: ReconciliationAction[];
  success: boolean;
  errorMessage?: string;
};

export type ReconciliationAction = {
  rewardId: string;
  type: "Added" | "Removed";
  success: boolean;
  assignmentId?: string;
  errorMessage?: string;
};

export type CreateRewardRequest = {
  displayId: string;
  moduleId: string;
  // eslint-disable-next-line
  parameters?: Record<string, any>;
  duration: RewardDuration | null;
};

export type UpdateRewardRequest = {
  displayId?: string;
  // eslint-disable-next-line
  parameters?: Record<string, any>;
  duration: RewardDuration | null;
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
    // eslint-disable-next-line
    missingMembers: any[];
    // eslint-disable-next-line
    extraAssignments: any[];
    // eslint-disable-next-line
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

// Provider Integration Types

export interface PatreonStatusResponse {
  isLinked: boolean;
  battleTag?: string;
  patreonUserId?: string;
  linkedAt?: string;
  lastSyncAt?: string;
}

export interface PatreonOAuthResponse {
  success: boolean;
  battleTag?: string;
  patreonUserId?: string;
  linkedAt?: string;
  message?: string;
  error?: string;
}

export interface UnlinkResponse {
  success: boolean;
  battleTag?: string;
  message?: string;
}

// Drift Sync Types

export interface DriftSyncResult {
  success: boolean;
  wasDryRun: boolean;
  membersAdded: number;
  tiersUpdated: number;
  assignmentsRevoked: number;
  processedAssociations: string[];
  errors: string[];
  startedAt: string;
  completedAt: string;
}

// Admin Management Types

export interface RewardManagementSummary {
  totalRewards: number;
  activeRewards: number;
  inactiveRewards: number;
  totalAssignments: number;
  activeAssignments: number;
  expiredAssignments: number;
  revokedAssignments: number;
  failedAssignments: number;
  totalUsers: number;
  usersWithActiveRewards: number;
  recentAssignments: RewardAssignment[];
  problematicAssignments: RewardAssignment[];
}

export interface ProductMappingReconciliationResult {
  productMappingId: string;
  productMappingName: string;
  success: boolean;
  usersProcessed: number;
  rewardsAdded: number;
  rewardsRevoked: number;
  errors: string[];
  userActions: UserReconciliationEntry[];
  wasDryRun: boolean;
  processedAt: string;
}

// Moderation Status Types
export interface ModerationStatus {
  ban?: BannedPlayer;
  globalMute?: GloballyMutedPlayer;
  loungeMute?: LoungeMuteResponse;
}

export type BattleTagModerationMap = Record<string, ModerationStatus>;
