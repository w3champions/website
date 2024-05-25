import { ProfilePicture } from "@/store/personalSettings/types";

export type GlobalSearchState = {
  players: PlayerSearchInfo[];
  // False if we fetched all pages of the search
  hasMore: boolean;
};

export type PlayerSearchInfo = {
  battleTag: string;
  name: string;
  seasons: Season[];
  profilePicture: ProfilePicture;
  relevanceId: string;
};

export type Season = {
  id: number;
};
