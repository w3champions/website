export type OauthState = {
  code: string;
  token: string;
  blizzardVerifiedBtag: string;
  twitch_token: TwitchToken;
  isAdmin: boolean;
  permissions: string[];
  isLoadingBlizzardBtag: boolean;
};

export type W3cToken = {
  jwt: string;
  battleTag: string;
  isAdmin: boolean;
  bnetID: string;
  name: string;
  permissions: string[];
};

export interface TwitchToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export enum BnetOAuthRegion {
  us = "us",
  eu = "eu",
  cn = "cn",
}
