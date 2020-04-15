export type PersonalSettingsState = {
  personalSettings: PersonalSetting;
};

export type PersonalSetting = {
  ProfileMessage: string;
  ProfilePicture: string;
  Id: string;
}

export type SendMessageOptions = {
  message: string;
  bearer: string;
};

