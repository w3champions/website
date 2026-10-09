/** Mirrors CommercialLicenseTaggedPlayerDto (contract C2). Timestamps are ISO-8601. */
export interface CommercialLicenseTaggedPlayer {
  battleTag: string;
  note: string;
  notify: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

/** PUT body (contract C2). The acting battleTag is added server side. */
export interface CommercialLicenseTagRequest {
  note: string;
  notify: boolean;
}

export type CommercialLicenseState = {
  taggedPlayers: CommercialLicenseTaggedPlayer[];
  loading: boolean;
  saving: boolean;
  /** Last failed save/remove; shown in the dialog or banner. */
  error: string;
  /** Last failed load; kept apart so closing the dialog cannot hide it. */
  loadError: string;
};
