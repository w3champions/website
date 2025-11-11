import { INGAME_STATIC_RESOURCES_URL } from "@/main";
import { EAvatarCategory } from "@/store/types";

export function getAvatarUrl(category: EAvatarCategory, picId: number, isClassic: boolean): string {
  if (picId == undefined || picId == null) {
    return `${INGAME_STATIC_RESOURCES_URL}icons/raceAvatars/STARTER_${Math.floor(Math.random() * 5) + 1}.jpg?v=2`;
  }

  const raceIconPrefix = isClassic ? "classic/" : "";

  if (category == EAvatarCategory.STARTER) {
    return `${INGAME_STATIC_RESOURCES_URL}icons/raceAvatars/${raceIconPrefix}STARTER_${picId}.jpg?v=2`;
  }

  if (category == EAvatarCategory.SPECIAL) {
    return `${INGAME_STATIC_RESOURCES_URL}icons/specialAvatars/SPECIAL_${picId}.jpg?v=2`;
  }

  const categoryString = EAvatarCategory[category].toString();

  return `${INGAME_STATIC_RESOURCES_URL}icons/raceAvatars/${raceIconPrefix}${categoryString}_${picId}.jpg?v=2`;
}

export function getProfileUrl(playerId: string): string {
  return "/player/" + encodeURIComponent(`${playerId}`);
}

export function getAsset(path: string): string {
  return `/assets/${path}`;
}

export function getTournamentUrl(tournamentId: string): string {
  return "/tournaments/" + encodeURIComponent(`${tournamentId}`);
}
