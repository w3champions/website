import { INGAME_STATIC_RESOURCES_URL } from "@/main";
import { EAvatarCategory } from "@/store/typings";

export function getAvatarUrl(
  category: EAvatarCategory,
  picId: number,
  isClassic: boolean
) {
  if (picId == undefined || picId == null) {
    return `${INGAME_STATIC_RESOURCES_URL}icons/raceAvatars/RANDOM_0.jpg`;
  }
  if (category == EAvatarCategory.SPECIAL) {
    return `${INGAME_STATIC_RESOURCES_URL}icons/specialAvatars/SPECIAL_${picId}.jpg`;
  } else {
    const raceIconPrefix = isClassic ? "classic/" : "";
    const categoryString = EAvatarCategory[category].toString();
    return `${INGAME_STATIC_RESOURCES_URL}icons/raceAvatars/${raceIconPrefix}${categoryString}_${picId}.jpg`;
  }
}

export function getProfileUrl(playerId: string) {
  return "/player/" + encodeURIComponent(`${playerId}`);
}

export function getAsset(path: string) {
  return require(`../assets/${path}`);
}
