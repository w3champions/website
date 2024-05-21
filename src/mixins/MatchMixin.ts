import { Match } from "@/store/types";
import { i18n } from "@/main";
import { useI18n } from "vue-i18n";

export function mapNameFromMatch(match: Match) {
  const { t } = useI18n();
  if (match.mapName) {
    return match.mapName;
  }
  return t("mapNames." + match.map.replace("'", ""));
}
