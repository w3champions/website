import { API_URL } from "@/main";
import { BannedPlayer, BannedPlayersGetRequest, BannedPlayersResponse, ChangePortraitsCommand, ChangePortraitsDto, CreateRewardRequest, DriftDetectionResult, DriftSyncResult, GlobalChatBanResponse, GlobalMute, ModuleDefinition, PaginatedAssignments, PatreonAccountLink, PortraitDefinition, PortraitDefinitionDTO, PortraitDefinitionGroup, ProductMapping, ProductMappingUsersResponse, ProviderConfiguration, Proxy, ProxySettings, QueueData, ReconciliationResult, ReplayChatLog, Reward, RewardAssignment, SearchedPlayer, UpdateRewardRequest } from "@/store/admin/types";
import { authorizedFetch } from "@/helpers/general";
import { SmurfDetectionResult } from "./smurf-detection/SmurfDetectionResponse";

export default class AdminService {
  public static async getBannedPlayers(token: string, req: BannedPlayersGetRequest): Promise<BannedPlayersResponse> {
    let url = `${API_URL}api/admin/bannedPlayers?page=${req.page}&itemsPerPage=${req.itemsPerPage}`;

    if (req.sortBy) {
      url += `&sortBy=${req.sortBy}`;
      url += `&sortDirection=${req.sortDirection}`;
    }
    if (req.search) {
      url += `&search=${encodeURIComponent(req.search)}`;
    }

    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }

  public static async postBan(bannedPlayer: BannedPlayer, token: string): Promise<string> {
    const url = `${API_URL}api/admin/bannedPlayers`;
    const response = await authorizedFetch("POST", url, token, JSON.stringify(bannedPlayer));
    return response.ok ? "" : await response.json();
  }

  public static async getQueueData(token: string): Promise<QueueData[] | null> {
    const url = `${API_URL}api/admin/queue-data`;
    const response = await authorizedFetch("GET", url, token);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  }

  public static async getAvailableProxies(token: string): Promise<Proxy[]> {
    const url = `${API_URL}api/admin/proxies`;
    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }

  public static async searchByTag(battleTagFragment: string, token: string): Promise<SearchedPlayer[]> {
    const url = `${API_URL}api/admin/search/${encodeURIComponent(battleTagFragment)}`;
    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }

  public static async getProxiesForBattletag(battleTag: string, token: string): Promise<ProxySettings> {
    const url = `${API_URL}api/admin/proxies-for/${encodeURIComponent(battleTag)}`;

    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }

  public static async putProxies(proxies: ProxySettings, battleTag: string, token: string): Promise<Response> {
    const url = `${API_URL}api/admin/update-proxies/${encodeURIComponent(battleTag)}`;
    return await authorizedFetch("PUT", url, token, JSON.stringify(proxies));
  }

  /**
   * @deprecated Use getSmurfsForBattletag instead
   */
  public static async getAltsForBattletag(btag: string, token: string): Promise<string[]> {
    const url = `${API_URL}api/admin/alts/${encodeURIComponent(btag)}`;

    const response = await authorizedFetch("GET", url, token);

    return await response.json();
  }

  public static async getSmurfIdentifierTypes(token: string): Promise<string[]> {
    const url = `${API_URL}api/admin/smurf-detection/possible-identifier-types`;
    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }

  public static async querySmurfsForIdentifier(identifierType: string, identifier: string, iterationDepth: number, generateExplanation: boolean, token: string): Promise<SmurfDetectionResult> {
    const generateExplanationString = generateExplanation ? "true" : "false";
    const url = `${API_URL}api/admin/smurf-detection/query-smurfs?identifierType=${identifierType}&identifier=${encodeURIComponent(identifier)}&iterationDepth=${iterationDepth}&generateExplanation=${generateExplanationString}`;
    const response = await authorizedFetch("GET", url, token);

    return await response.json() as SmurfDetectionResult;
  }

  public static async getGlobalMutes(token: string, searchQuery: string | undefined, nextId: number | null): Promise<GlobalChatBanResponse> {
    let url = `${API_URL}api/admin/globalChatBans`;
    if (searchQuery) {
      url += `?query=${encodeURIComponent(searchQuery)}`;
    }
    else if (nextId) {
      url += `?nextId=${nextId}`;
    }

    const response = await authorizedFetch("GET", url, token);

    return await response.json();
  }

  public static async deleteGlobalMute(token: string, id: string): Promise<number> {
    const url = `${API_URL}api/admin/globalChatBans/${id}`;
    const response = await authorizedFetch("DELETE", url, token);
    return response.status;
  }

  public static async putGlobalMute(token: string, mute: GlobalMute): Promise<number> {
    const url = `${API_URL}api/admin/globalChatBans`;
    const response = await authorizedFetch("PUT", url, token, JSON.stringify(mute));
    return response.status;
  }

  public static async getAllSpecialPortraits(token: string): Promise<PortraitDefinition[]> {
    const url = `${API_URL}api/rewards/portrait-definitions`;
    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }

  public static async putPortraits(token: string, command: ChangePortraitsCommand): Promise<number> {
    const url = `${API_URL}api/rewards/portraits`;

    const data = {
      BnetTags: command.battleTags,
      Portraits: command.portraitIds,
      Tooltip: command.mouseover,
    } as ChangePortraitsDto;
    const response = await authorizedFetch("PUT", url, token, JSON.stringify(data));

    return response.status;
  }

  public static async deletePortraits(token: string, command: ChangePortraitsCommand): Promise<number> {
    const url = `${API_URL}api/rewards/portraits`;

    const data = {
      BnetTags: command.battleTags,
      Portraits: command.portraitIds,
    } as ChangePortraitsDto;

    const response = await authorizedFetch("DELETE", url, token, JSON.stringify(data));

    return response.status;
  }

  public static async getAllPortraitDefinitionGroups(): Promise<PortraitDefinitionGroup[]> {
    const url = `${API_URL}api/rewards/portrait-groups`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return response.json();
  }

  public static async postPortraitDefinitions(token: string, definitions: PortraitDefinitionDTO): Promise<number> {
    const url = `${API_URL}api/rewards/portrait-definitions`;

    const response = await authorizedFetch("POST", url, token, JSON.stringify(definitions));
    return response.status;
  }

  public static async putPortraitDefinitions(token: string, definitions: PortraitDefinitionDTO): Promise<number> {
    const url = `${API_URL}api/rewards/portrait-definitions`;

    const response = await authorizedFetch("PUT", url, token, JSON.stringify(definitions));

    return response.status;
  }

  public static async deletePortraitDefinitions(token: string, definitions: PortraitDefinitionDTO): Promise<number> {
    const url = `${API_URL}api/rewards/portrait-definitions`;

    const response = await authorizedFetch("DELETE", url, token, JSON.stringify(definitions));
    return response.status;
  }

  public static async getChatLog(token: string, matchId: string): Promise<ReplayChatLog> {
    const url = `${API_URL}api/replays/${matchId}/chats`;

    const response = await authorizedFetch("GET", url, token);
    return response.json();
  }

  public static async checkJwtLifetime(token: string): Promise<boolean> {
    const url = `${API_URL}api/admin/checkJwtLifetime`;
    const response = await authorizedFetch("GET", url, token);
    return response.ok;
  }

  // Rewards Management Methods

  public static async getRewards(token: string): Promise<Reward[]> {
    const url = `${API_URL}api/rewards`;
    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }

  public static async getAvailableModules(token: string): Promise<ModuleDefinition[]> {
    const url = `${API_URL}api/rewards/modules`;
    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }

  public static async getReward(rewardId: string, token: string): Promise<Reward> {
    const url = `${API_URL}api/rewards/${rewardId}`;
    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }

  public static async createReward(reward: CreateRewardRequest, token: string): Promise<Reward> {
    const url = `${API_URL}api/rewards`;
    const response = await authorizedFetch("POST", url, token, JSON.stringify(reward));
    return await response.json();
  }

  public static async updateReward(rewardId: string, reward: UpdateRewardRequest, token: string): Promise<Reward> {
    const url = `${API_URL}api/rewards/${rewardId}`;
    const response = await authorizedFetch("PUT", url, token, JSON.stringify(reward));

    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.error || "Failed to update reward");
      // (error as any).response = { status: response.status, data: errorData };
      throw error;
    }

    return await response.json();
  }

  public static async deleteReward(rewardId: string, token: string): Promise<boolean> {
    const url = `${API_URL}api/rewards/${rewardId}`;
    const response = await authorizedFetch("DELETE", url, token);

    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.error || "Failed to delete reward");
      // (error as any).response = { status: response.status, data: errorData };
      throw error;
    }

    return response.ok;
  }

  public static async getUserAssignments(userId: string, token: string): Promise<RewardAssignment[]> {
    const url = `${API_URL}api/rewards/assignments/${encodeURIComponent(userId)}`;
    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }

  public static async getProviderConfigurations(token: string): Promise<ProviderConfiguration[]> {
    const url = `${API_URL}api/rewards/providers`;
    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }

  public static async getProductMappings(token: string): Promise<ProductMapping[]> {
    const url = `${API_URL}api/rewards/product-mappings`;
    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }

  public static async createProductMapping(token: string, mapping: ProductMapping): Promise<ProductMapping> {
    const url = `${API_URL}api/rewards/product-mappings`;
    const response = await authorizedFetch("POST", url, token, JSON.stringify(mapping));
    return await response.json();
  }

  public static async updateProductMapping(token: string, mappingId: string, mapping: ProductMapping): Promise<ProductMapping> {
    const url = `${API_URL}api/rewards/product-mappings/${mappingId}`;
    const response = await authorizedFetch("PUT", url, token, JSON.stringify(mapping));
    return await response.json();
  }

  public static async deleteProductMapping(token: string, mappingId: string): Promise<boolean> {
    const url = `${API_URL}api/rewards/product-mappings/${mappingId}`;
    const response = await authorizedFetch("DELETE", url, token);
    return response.ok;
  }

  public static async getProductMappingUsers(token: string, mappingId: string): Promise<ProductMappingUsersResponse> {
    const url = `${API_URL}api/rewards/product-mappings/${mappingId}/users`;
    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }

  public static async reconcileAllProductMappings(token: string, dryRun = true): Promise<ReconciliationResult> {
    const url = `${API_URL}api/rewards/admin/product-mappings/reconcile-all?dryRun=${dryRun}`;
    const response = await authorizedFetch("POST", url, token);
    return await response.json();
  }

  public static async detectPatreonDrift(token: string): Promise<DriftDetectionResult> {
    const url = `${API_URL}api/rewards/drift-detection/patreon/detect`;
    const response = await authorizedFetch("POST", url, token);
    return await response.json();
  }

  // eslint-disable-next-line
  public static async getDriftDetectionStatus(token: string): Promise<any> {
    const url = `${API_URL}api/rewards/drift-detection/status`;
    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }

  public static async syncPatreonDrift(driftResult: DriftDetectionResult, dryRun: boolean, token: string): Promise<DriftSyncResult> {
    const url = `${API_URL}api/rewards/drift-detection/patreon/sync?dryRun=${dryRun}`;
    const response = await authorizedFetch("POST", url, token, JSON.stringify({ driftResult }));

    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.error || "Failed to sync Patreon drift");
      // (error as any).response = { status: response.status, data: errorData };
      throw error;
    }

    return await response.json();
  }

  // New endpoints for Patreon links and enhanced assignments management

  public static async getAllPatreonLinks(token: string): Promise<{ links: PatreonAccountLink[]; totalLinks: number }> {
    const url = `${API_URL}api/rewards/admin/patreon/links`;
    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }

  public static async deletePatreonLink(battleTag: string, token: string): Promise<boolean> {
    const url = `${API_URL}api/rewards/admin/patreon/links/${encodeURIComponent(battleTag)}`;
    const response = await authorizedFetch("DELETE", url, token);
    return response.ok;
  }

  // eslint-disable-next-line
  public static async getPatreonMemberDetails(battleTag: string, token: string): Promise<any> {
    const url = `${API_URL}api/rewards/admin/patreon/members/${encodeURIComponent(battleTag)}`;
    const response = await authorizedFetch("GET", url, token);
    if (!response.ok) {
      throw new Error(`Failed to fetch member details: ${response.statusText}`);
    }
    return await response.json();
  }

  public static async getAllAssignments(token: string, page = 1, pageSize = 50): Promise<PaginatedAssignments> {
    const url = `${API_URL}api/rewards/admin/assignments/all?page=${page}&pageSize=${pageSize}`;
    const response = await authorizedFetch("GET", url, token);
    return await response.json();
  }

  public static async getAssignmentsByReward(rewardId: string, token: string): Promise<RewardAssignment[]> {
    const url = `${API_URL}api/rewards/admin/rewards/${encodeURIComponent(rewardId)}/assignments`;
    const response = await authorizedFetch("GET", url, token);
    const data = await response.json();

    // Handle new response structure that wraps assignments in an object
    if (data && data.assignments && Array.isArray(data.assignments)) {
      return data.assignments;
    }

    // Fallback for backward compatibility if response is still a direct array
    return Array.isArray(data) ? data : [];
  }
}
