import { API_URL, PATREON_REDIRECT_URL } from "@/main";
import { authorizedFetch } from "@/helpers/general";

export interface PatreonLinkStatus {
  isLinked: boolean;
  patreonEmail?: string;
  patreonUserId?: string;
  linkedAt?: string;
}

export interface UserReward {
  id: string;
  name: string;
  description: string;
  type: string;
  assignedAt: string;
  expiresAt?: string;
}

export interface RewardAssignment {
  userId: string;
  rewardId: string;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface PatreonOAuthResponse {
  authUrl: string;
  state: string;
}

export default class RewardsService {

  /**
   * Get Patreon link status for the current user
   */
  public static async getPatreonLinkStatus(token: string): Promise<PatreonLinkStatus> {
    const url = `${API_URL}api/rewards/patreon/status`;
    const response = await authorizedFetch("GET", url, token);

    if (!response.ok) {
      throw new Error("Failed to get Patreon link status");
    }

    return await response.json();
  }

  /**
   * Initiate Patreon OAuth flow
   */
  public static async initiatePatreonOAuth(token: string): Promise<PatreonOAuthResponse> {
    const url = `${API_URL}api/rewards/patreon/oauth/initiate`;
    const response = await authorizedFetch("POST", url, token);

    if (!response.ok) {
      throw new Error("Failed to initiate Patreon OAuth");
    }

    return await response.json();
  }

  /**
   * Complete Patreon OAuth flow with authorization code
   */
  public static async completePatreonOAuth(code: string, state: string, token: string): Promise<PatreonLinkStatus> {
    const url = `${API_URL}api/rewards/patreon/oauth/callback`;
    const payload = {
      code,
      state,
      redirectUri: PATREON_REDIRECT_URL,
    };

    const response = await authorizedFetch("POST", url, token, JSON.stringify(payload));

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to complete Patreon OAuth");
    }

    return await response.json();
  }

  /**
   * Unlink Patreon account
   */
  public static async unlinkPatreonAccount(token: string): Promise<void> {
    const url = `${API_URL}api/rewards/patreon/unlink`;
    const response = await authorizedFetch("DELETE", url, token);

    if (!response.ok) {
      throw new Error("Failed to unlink Patreon account");
    }
  }

  /**
   * Get user's reward assignments
   */
  public static async getUserRewards(token: string): Promise<UserReward[]> {
    const url = `${API_URL}api/rewards/assignments`;
    const response = await authorizedFetch("GET", url, token);

    if (!response.ok) {
      throw new Error("Failed to get user rewards");
    }

    return await response.json();
  }

  /**
   * Get all available rewards
   */
  public static async getAvailableRewards(): Promise<UserReward[]> {
    const url = `${API_URL}api/rewards`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get available rewards");
    }

    return await response.json();
  }

}