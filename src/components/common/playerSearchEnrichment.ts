import { ProfilePicture } from "@/store/personalSettings/types";
import { ModeStat } from "@/store/player/types";
import { getAvatarUrl } from "@/helpers/url-functions";
import { EAvatarCategory } from "@/store/types";

// Extra per-player data fetched to enhance the player search dropdown
// (avatar, country and game mode stats shown in the hover card).
export type PlayerSearchEnrichment = {
  profilePicture?: ProfilePicture;
  countryCode?: string;
  location?: string;
  // undefined while loading; sorted by games played (desc) once loaded
  modeStats?: ModeStat[];
  maxMmr?: number;
};

export function getSearchPlayerAvatarUrl(battleTag: string, enrichment?: PlayerSearchEnrichment): string {
  const pfp = enrichment?.profilePicture;
  if (pfp) {
    return getAvatarUrl(pfp.race, pfp.pictureId, pfp.isClassic);
  }

  // Players without personal settings get the same default the backend uses:
  // a starter avatar (1-5), derived from the battleTag so it is stable across renders.
  let hash = 0;
  for (let i = 0; i < battleTag.length; i++) {
    hash = (hash * 31 + battleTag.charCodeAt(i)) | 0;
  }
  return getAvatarUrl(EAvatarCategory.STARTER, (Math.abs(hash) % 5) + 1, false);
}

export function getMaxMmr(modeStats: ModeStat[]): number {
  return modeStats.reduce((max, stat) => (stat.games > 0 && stat.mmr > max ? stat.mmr : max), 0);
}
