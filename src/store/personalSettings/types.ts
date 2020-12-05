import { ERaceEnum, EAvatarCategory } from "@/store/typings";
import { RaceStat } from "@/store/player/types";

export type PersonalSettingsState = {
  personalSettings: PersonalSetting;
};

export type ProfilePicture = {
  race: EAvatarCategory;
  pictureId: number;
  isClassic: boolean;
  description?: string;
};

export type RaceToMaxPicture = {
  race: ERaceEnum;
  max: number;
};

export type WinsToPictureId = {
  pictureId: number;
  neededWins: number;
};

export type SpecialPicture = {
  pictureId: number;
  description: string;
}

export type PersonalSetting = {
  profileMessage: string;
  homePage?: string;
  twitch: string;
  youTube: string;
  twitter: string;
  trovo?: string;
  douyu?: string;
  country: string;
  countryCode: string;
  location?: string;
  profilePicture: ProfilePicture;
  pickablePictures: RaceToMaxPicture[];
  pictureRange: WinsToPictureId[];
  winLosses: RaceStat[];
  specialPictures: SpecialPicture[];
  id: string;
};
