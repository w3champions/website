export interface PatreonLinkStatus {
  isLinked: boolean;
  patreonEmail?: string;
  patreonUserId?: string;
  linkedAt?: string;
}

export interface UserReward {
  id: string;
  displayId: string;
  moduleId: string;
  moduleName: string;
  assignedAt: string;
  expiresAt?: string;
}

export interface RewardsState {
  isPatreonLinked: boolean;
  patreonEmail: string;
  patreonUserId: string;
  linkedAt: string;
  userRewards: UserReward[];
  availableRewards: UserReward[];
  isLoadingRewards: boolean;
  isLoadingPatreonStatus: boolean;
}
