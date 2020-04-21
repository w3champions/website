export type PersonalSettingsState = {
  personalSettings: PersonalSetting;
};

export type PersonalSetting = {
  profileMessage: string;
  homePage: string;
  profilePicture: string;
  id: string;
}
