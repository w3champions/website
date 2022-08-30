import { ProfilePicture } from "@/store/personalSettings/types";

export type GlobalSearchState = {
  players: PlayerSearchData[];
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
