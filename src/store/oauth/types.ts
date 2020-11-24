export type OauthState = {
  code: string;
  token: string;
  blizzardVerifiedBtag: string;
  twitch_token: TwitchToken;
  isAdmin: boolean;
};

export type W3cToken = {
  token: string;
  battleTag: string;
  isAdmin: boolean;
};

export interface TwitchToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}
