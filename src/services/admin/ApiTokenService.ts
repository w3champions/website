import { API_URL } from "@/main";
import { authorizedFetch } from "@/helpers/general";
import { ApiToken, CreateApiTokenRequest, UpdateApiTokenRequest } from "@/types/admin/ApiToken";

export default class ApiTokenService {
  public static async getAllTokens(token: string): Promise<ApiToken[]> {
    const url = `${API_URL}api/admin/api-tokens`;
    const response = await authorizedFetch("GET", url, token);

    return response.ok ? await response.json() : [];
  }

  public static async getToken(id: string, token: string): Promise<ApiToken | null> {
    const url = `${API_URL}api/admin/api-tokens/${id}`;
    const response = await authorizedFetch("GET", url, token);

    return response.ok ? await response.json() : null;
  }

  public static async createToken(request: CreateApiTokenRequest, token: string): Promise<ApiToken> {
    const url = `${API_URL}api/admin/api-tokens`;
    const response = await authorizedFetch("POST", url, token, JSON.stringify(request));

    if (!response.ok) {
      throw new Error("Failed to create API token");
    }

    return await response.json();
  }

  public static async updateToken(id: string, request: UpdateApiTokenRequest, token: string): Promise<boolean> {
    const url = `${API_URL}api/admin/api-tokens/${id}`;
    const response = await authorizedFetch("PUT", url, token, JSON.stringify(request));

    return response.ok;
  }

  public static async deleteToken(id: string, token: string): Promise<boolean> {
    const url = `${API_URL}api/admin/api-tokens/${id}`;
    const response = await authorizedFetch("DELETE", url, token);

    return response.ok;
  }

  public static async regenerateToken(id: string, token: string): Promise<ApiToken> {
    const url = `${API_URL}api/admin/api-tokens/${id}/regenerate`;
    const response = await authorizedFetch("POST", url, token);

    if (!response.ok) {
      throw new Error("Failed to regenerate API token");
    }

    return await response.json();
  }

  public static async activateToken(id: string, token: string): Promise<boolean> {
    const url = `${API_URL}api/admin/api-tokens/${id}/activate`;
    const response = await authorizedFetch("POST", url, token);

    return response.ok;
  }

  public static async deactivateToken(id: string, token: string): Promise<boolean> {
    const url = `${API_URL}api/admin/api-tokens/${id}/deactivate`;
    const response = await authorizedFetch("POST", url, token);

    return response.ok;
  }
}
