import { defineStore } from "pinia";
import { RewardsState, PatreonLinkStatus } from "./types";
import RewardsService from "@/services/RewardsService";
import { PATREON_REDIRECT_URL } from "@/main";

export const useRewardsStore = defineStore("rewards", {
  state: (): RewardsState => ({
    isPatreonLinked: false,
    patreonEmail: "",
    patreonUserId: "",
    linkedAt: "",
    userRewards: [],
    availableRewards: [],
    isLoadingRewards: false,
    isLoadingPatreonStatus: false,
  }),

  actions: {
    /**
     * Load Patreon link status for the authenticated user
     */
    async loadPatreonLinkStatus(token: string): Promise<void> {
      this.isLoadingPatreonStatus = true;
      try {
        const status = await RewardsService.getPatreonLinkStatus(token);
        this.setPatreonLinkStatus(status);
      } catch (error) {
        console.error("Failed to load Patreon link status:", error);
        this.resetPatreonLinkStatus();
        throw error;
      } finally {
        this.isLoadingPatreonStatus = false;
      }
    },

    /**
     * Initiate Patreon OAuth flow
     */
    async initiatePatreonOAuth(): Promise<void> {
      try {
        // Hardcoded Patreon OAuth URL for now
        const clientId = "NQfJXU43KYIBkj6kCMFIaEY-83JuVH9rCJKaleKhm3jDAy-gxRC7bzn4aPo9UJgf";
        const state = Math.random().toString(36).substring(2, 15); // Simple state generation against CSRF

        const patreonAuthUrl = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${PATREON_REDIRECT_URL}&state=${state}&scope=identity.memberships`;

        // Store state for validation (simple localStorage for now)
        localStorage.setItem("patreon_oauth_state", state);

        // Redirect to Patreon OAuth URL
        window.location.href = patreonAuthUrl;
      } catch (error) {
        console.error("Failed to initiate Patreon OAuth:", error);
        throw error;
      }
    },

    /**
     * Complete Patreon OAuth flow
     */
    async completePatreonOAuth(code: string, state: string, token: string): Promise<PatreonLinkStatus> {
      try {
        const result = await RewardsService.completePatreonOAuth(code, state, token);
        this.setPatreonLinkStatus(result);
        return result;
      } catch (error) {
        console.error("Failed to complete Patreon OAuth:", error);
        throw error;
      }
    },

    /**
     * Unlink Patreon account
     */
    async unlinkPatreonAccount(token: string): Promise<void> {
      try {
        await RewardsService.unlinkPatreonAccount(token);
        this.resetPatreonLinkStatus();
      } catch (error) {
        console.error("Failed to unlink Patreon account:", error);
        throw error;
      }
    },

    /**
     * Load user's rewards
     */
    async loadUserRewards(token: string): Promise<void> {
      this.isLoadingRewards = true;
      try {
        const rewards = await RewardsService.getUserRewards(token);
        this.userRewards = rewards;
      } catch (error) {
        console.error("Failed to load user rewards:", error);
        this.userRewards = [];
        throw error;
      } finally {
        this.isLoadingRewards = false;
      }
    },

    /**
     * Load available rewards
     */
    async loadAvailableRewards(): Promise<void> {
      try {
        const rewards = await RewardsService.getAvailableRewards();
        this.availableRewards = rewards;
      } catch (error) {
        console.error("Failed to load available rewards:", error);
        this.availableRewards = [];
        throw error;
      }
    },

    /**
     * Set Patreon link status
     */
    setPatreonLinkStatus(status: PatreonLinkStatus): void {
      this.isPatreonLinked = status.isLinked;
      this.patreonEmail = status.patreonEmail || "";
      this.patreonUserId = status.patreonUserId || "";
      this.linkedAt = status.linkedAt || "";
    },

    /**
     * Reset Patreon link status
     */
    resetPatreonLinkStatus(): void {
      this.isPatreonLinked = false;
      this.patreonEmail = "";
      this.patreonUserId = "";
      this.linkedAt = "";
    },

    /**
     * Reset all rewards data
     */
    resetRewardsData(): void {
      this.userRewards = [];
      this.availableRewards = [];
      this.isLoadingRewards = false;
      this.isLoadingPatreonStatus = false;
    },

    /**
     * Reset entire store state
     */
    reset(): void {
      this.resetPatreonLinkStatus();
      this.resetRewardsData();
    },
  },
});