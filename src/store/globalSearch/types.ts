import { PersonalSetting } from "@/store/personalSettings/types";

export type GlobalSearchState = {
  players: PlayerSearchData[];
};

export type PlayerSearchData = {
  battleTag: string;
  name: string;
  seasons: Season[];
  personalSetting: PersonalSetting;
};

export type Season = {
  id: number;
};
