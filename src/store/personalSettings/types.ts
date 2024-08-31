import { EAvatarCategory, ERaceEnum } from "@/store/types";
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
  avatarType: ERaceEnum;
  max: number;
};

export type WinsToPictureId = {
  pictureId: number;
  neededWins: number;
};

export type SpecialPicture = {
  pictureId: number;
  description: string;
};

export type AkaSettings = {
  showAka: boolean;
  showW3info: boolean;
  showLiquipedia: boolean;
};

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
  racePictureRange: WinsToPictureId[];
  totalPictureRange: WinsToPictureId[];
  tournamentPictureRange: WinsToPictureId[];
  winLosses: RaceStat[];
  specialPictures: SpecialPicture[];
  id: string;
  aliasSettings: AkaSettings;
};

export type ProfilePlayerSocials = {
  twitch: string;
  youtube: string;
  twitter: string;
  trovo: string;
  douyu: string;
  aliasSettings: AkaSettings;
  about: string;
  homePage: string;
};
