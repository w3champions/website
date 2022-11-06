import { PlayerInfo, Ranking } from "@/store/ranking/types";
import { ERaceEnum } from "@/store/typings";
import { getAsset, getAvatarUrl } from "./url-functions";

export function getRaceIcon(ranking: Ranking, playerIndex: number): string {
  const playersInfo = ranking.playersInfo;
  if (!playersInfo) return raceIcon(ERaceEnum.RANDOM);
  const playerInfo = playersInfo[playerIndex];
  if (hasSelectedIcon(playerInfo)) {
    return getAvatarUrl(
    playerInfo.selectedRace,
    playerInfo.pictureId,
    playerInfo.isClassicPicture
    );
  } else {
    return raceIcon(playerInfo.calculatedRace);
  }
}

function raceIcon(race: ERaceEnum) {
  return getAsset(`raceIcons/${ERaceEnum[race]}.jpg`);
}

export function hasSelectedIcon(playerInfo: PlayerInfo) {
  return (
    playerInfo.selectedRace !== undefined &&
    playerInfo.selectedRace != null &&
    playerInfo.pictureId !== undefined &&
    playerInfo.pictureId != null
  );
}