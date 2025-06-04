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
  Permissions,
  Moderation,
  Queue,
  Logs,
  Maps,
  Tournaments,
  Content,
  Proxies,
  SmurfCheckerQuery,
  SmurfCheckerQueryExplanation,
  SmurfCheckerAdministration,
}
