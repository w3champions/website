import {ERaceEnum} from "@/store/typings";

export type PersonalSettingsState = {
  personalSettings: PersonalSetting;
};

export type ProfilePicture = {
  race: ERaceEnum;
  pictureId: number;
}

export type RaceToMaxPicture = {
  race: ERaceEnum;
  max: number;
}

export type WinsToPictureId = {
  pictureId: number;
  neededWins: number;
}

export type PersonalSetting = {
  profileMessage: string;
  homePage: string;
  profilePicture: ProfilePicture;
  pickablePictures: RaceToMaxPicture[];
  pictureRange: WinsToPictureId[];
  id: string;
}
