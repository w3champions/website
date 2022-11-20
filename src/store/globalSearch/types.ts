import { ProfilePicture } from "@/store/personalSettings/types";

export type GlobalSearchState = {
  players: PlayerSearchData[];
  // False if we fetched all pages of the search
  hasMore: boolean;
};

export type PlayerSearchData = {
  battleTag: string;
  name: string;
  seasons: Season[];
  profilePicture: ProfilePicture;
};

export type Season = {
  id: number;
};
