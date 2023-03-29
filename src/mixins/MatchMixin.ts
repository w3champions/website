import Vue from "vue";
import { Component } from "vue-property-decorator";
import { Match } from "@/store/types";

@Component
export default class MatchMixin extends Vue {
  public $_mapNameFromMatch(match: Match) {
    if (match.mapName) {
      return match.mapName;
    }
    return this.$_translatedMapString(match.map);
  }

  public $_translatedMapString(legacyMapName: string) {
    return this.$t("mapNames." + legacyMapName.replace("'", ""));
  }
}
