import type { PlayerInfo } from "@/store/ranking/types";
import { EAvatarCategory, ERaceEnum } from "@/store/types";
import { getAsset, getAvatarUrl } from "@/helpers/url-functions";
import { useI18n } from "vue-i18n";

interface UsePlayerAvatar {
  // True when the player has a chosen avatar picture (not the default race-derived icon).
  hasSelectedIcon: (playerInfo: PlayerInfo) => boolean;
  // The avatar image URL: the selected picture if present, otherwise the calculated-race icon.
  getPlayerIcon: (playerInfo: PlayerInfo) => string;
  // The translated race label used as the avatar's title/tooltip.
  getAvatarTitle: (playerInfo: PlayerInfo) => string;
}

// Shared avatar/icon logic for ladder player cells (apex + progression ladders).
export function usePlayerAvatar(): UsePlayerAvatar {
  const { t } = useI18n();

  function hasSelectedIcon(playerInfo: PlayerInfo): boolean {
    return (
      playerInfo.selectedRace !== undefined
      && playerInfo.selectedRace != null
      && playerInfo.pictureId !== undefined
      && playerInfo.pictureId != null
      && playerInfo.selectedRace !== EAvatarCategory.TOTAL
    );
  }

  function getRaceIcon(race: ERaceEnum): string {
    return getAsset(`raceIcons/${ERaceEnum[race]}.jpg`);
  }

  function getPlayerIcon(playerInfo: PlayerInfo): string {
    if (hasSelectedIcon(playerInfo)) {
      return getAvatarUrl(playerInfo.selectedRace, playerInfo.pictureId, playerInfo.isClassicPicture);
    }
    return getRaceIcon(playerInfo.calculatedRace);
  }

  function getAvatarTitle(playerInfo: PlayerInfo): string {
    if (hasSelectedIcon(playerInfo) && playerInfo.selectedRace <= ERaceEnum.UNDEAD) {
      return t(`races.${ERaceEnum[playerInfo.selectedRace]}`);
    }
    return t(`races.${ERaceEnum[playerInfo.calculatedRace]}`);
  }

  return { hasSelectedIcon, getPlayerIcon, getAvatarTitle };
}
