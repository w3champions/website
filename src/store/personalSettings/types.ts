import {ERaceEnum} from "@/store/typings";

export type PersonalSettingsState = {
  personalSettings: PersonalSetting;
};

export type ProfilePicture = {
  race: ERaceEnum;
  pictureId: number;
}

export type PersonalSetting = {
  profileMessage: string;
  homePage: string;
  profilePicture: ProfilePicture;
  id: string;
}
