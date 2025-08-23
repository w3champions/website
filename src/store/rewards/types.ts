export interface PatreonLinkStatus {
  isLinked: boolean;
  patreonEmail?: string;
  patreonUserId?: string;
  linkedAt?: string;
}

export interface UserReward {
  id: string;
  name: string;
  description?: string;
  type: string;
  isActive: boolean;
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