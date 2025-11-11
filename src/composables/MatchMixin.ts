import { Match } from "@/store/types";
import { useI18n } from "vue-i18n";

export function mapNameFromMatch(match: Match): string {
  if (match.mapName) {
    return match.mapName;
  }
  return useI18n().t("mapNames." + match.map.replace("'", ""));
}
