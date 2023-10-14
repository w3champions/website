import { EPermission } from "../admin/permission/types";

export type OauthState = {
  code: string;
  token: string;
  blizzardVerifiedBtag: string;
  twitch_token: TwitchToken;
  isAdmin: boolean;
  permissions: string[];
};

export type W3cToken = {
  jwt: string;
  battleTag: string;
  isAdmin: boolean;
  bnetID: string;
  name: string;
  permissions: string[]
};

export interface TwitchToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export enum BnetOAuthRegion {
  eu = "eu",
  cn = "cn",
}
