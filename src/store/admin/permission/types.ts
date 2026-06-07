export type PermissionState = {
  permissions: IPermission[];
  validationError: string;
};

export interface IPermission {
  id: string;
  battleTag: string;
  description: string;
  permissions: EPermission[];
  author: string;
}

export enum EPermission {
  Permissions = 0,
  Moderation = 1,
  Queue = 2,
  Logs = 3,
  Maps = 4,
  Tournaments = 5,
  Content = 6,
  Proxies = 7,
  SmurfCheckerQuery = 8,
  SmurfCheckerQueryExplanation = 9,
  SmurfCheckerAdministration = 10,
  Warnings = 11,
}
