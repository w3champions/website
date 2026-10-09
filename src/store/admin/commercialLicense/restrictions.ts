import type { CommercialLicenseRestrictions, CommercialLicenseTaggedPlayer, FloTvRestriction } from "./types";

/** Options of the "Block FloTV" select. */
export const FLO_TV_OPTIONS: { title: string; value: FloTvRestriction }[] = [
  { title: "None", value: "none" },
  { title: "Custom games", value: "custom" },
  { title: "All games", value: "all" },
];

/** What a tag without restrictions reads as (contract C-R1). */
function noRestrictions(): CommercialLicenseRestrictions {
  return { asPlayer: false, asObserver: false, floTv: "none" };
}

/** A tag as it arrives on the wire: `restrictions` may be null or missing (old matchmaking behind a new website-backend). */
export type CommercialLicenseTaggedPlayerWire = Omit<CommercialLicenseTaggedPlayer, "restrictions"> & { restrictions?: CommercialLicenseRestrictions | null };

/**
 * Normalizes a tag DTO from the wire. A new website-backend in front of an old
 * matchmaking sends `restrictions: null` (Newtonsoft leaves the field null) or omits it;
 * downstream code (draftFromTag, restrictionSummary, the table) must never see that.
 */
export function normalizeTag(raw: CommercialLicenseTaggedPlayerWire): CommercialLicenseTaggedPlayer {
  return { ...raw, restrictions: raw.restrictions ?? noRestrictions() };
}

/** Compact labels for the table, one per active restriction; empty when the tag restricts nothing. */
export function restrictionSummary(restrictions: CommercialLicenseRestrictions): string[] {
  const labels: string[] = [];
  if (restrictions.asPlayer) labels.push("Player");
  if (restrictions.asObserver) labels.push("Observer");
  if (restrictions.floTv === "custom") labels.push("FloTV: custom games");
  else if (restrictions.floTv === "all") labels.push("FloTV: all games");
  else if (restrictions.floTv !== "none") labels.push("FloTV: " + String(restrictions.floTv)); // unknown future value: never look unrestricted
  return labels;
}
