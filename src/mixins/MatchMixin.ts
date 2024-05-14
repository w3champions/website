import { Match } from "@/store/types";
import { i18n } from "@/main";

export function mapNameFromMatch(match: Match) {
  if (match.mapName) {
    return match.mapName;
  }
  return i18n.t("mapNames." + match.map.replace("'", ""));
}
