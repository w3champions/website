export type OauthState = {
  code: string;
  token: string;
  blizzardVerifiedBtag: string;
  twitch_token: TwitchToken;
  isAdmin: boolean;
};

export type BlizzardToken = {
  token: string;
  battleTag: string;
  expires_in: number;
};

export interface TwitchToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}
