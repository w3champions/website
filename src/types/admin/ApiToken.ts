export interface ApiTokenScope {
  hourlyLimit: number;
  dailyLimit: number;
  isEnabled: boolean;
}

export interface ApiToken {
  id: string;
  name: string;
  description: string;
  token: string;
  scopes: Record<string, ApiTokenScope>;
  isActive: boolean;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string | null;
  allowedIPs?: string[];
  contactDetails?: string;
}

export interface CreateApiTokenRequest {
  name: string;
  description?: string;
  scopes: Record<string, ApiTokenScope>;
  contactDetails?: string;
  allowedIPs?: string[];
  expiresAt?: string | null;
}

export interface UpdateApiTokenRequest extends CreateApiTokenRequest {
  isActive: boolean;
}