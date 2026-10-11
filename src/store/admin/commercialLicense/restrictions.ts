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

/**
 * A tag as it arrives on the wire: `restrictions` and `commercialEventNotice` may be
 * null or missing (System.Text.Json emits null; older matchmaking omits them).
 */
export type CommercialLicenseTaggedPlayerWire = Omit<CommercialLicenseTaggedPlayer, "restrictions" | "commercialEventNotice"> & {
  restrictions?: CommercialLicenseRestrictions | null;
  commercialEventNotice?: boolean | null;
};

/**
 * Normalizes a tag DTO from the wire so that downstream code (draftFromTag,
 * restrictionSummary, the table) never sees a null restrictions object or notice flag.
 */
export function normalizeTag(raw: CommercialLicenseTaggedPlayerWire): CommercialLicenseTaggedPlayer {
  return { ...raw, restrictions: raw.restrictions ?? noRestrictions(), commercialEventNotice: raw.commercialEventNotice ?? false };
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
