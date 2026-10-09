/** Which FloTV streams a tag blocks (contract C-R1). */
export type FloTvRestriction = "none" | "custom" | "all";

/** Mirrors the restrictions object of contract C-R1. Always present on read. */
export interface CommercialLicenseRestrictions {
  asPlayer: boolean;
  asObserver: boolean;
  floTv: FloTvRestriction;
}

/** Mirrors CommercialLicenseTaggedPlayerDto (contracts C2, C-R1). Timestamps are ISO-8601. */
export interface CommercialLicenseTaggedPlayer {
  battleTag: string;
  note: string;
  notify: boolean;
  restrictions: CommercialLicenseRestrictions;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

/**
 * PUT body (contracts C2, C-R1). The acting battleTag is added server side.
 * The backend treats a missing `restrictions` as "keep the stored value"; the website always sends it.
 */
export interface CommercialLicenseTagRequest {
  note: string;
  notify: boolean;
  restrictions: CommercialLicenseRestrictions;
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
