import Vue from "vue";
import { Component } from "vue-property-decorator";
import { EGameMode } from "@/store/typings";

@Component
export default class GameModesMixin extends Vue {
  public async loadActiveGameModes() {
    await this.$store.direct.dispatch.admin.mapsManagement.loadMapsForCurrentSeason();
  }

  public get activeGameModes() {
    return this.$store.direct.state.admin.mapsManagement.seasonMaps.map(seasonMap => {
      const id = seasonMap.id;
      const name = this.$t(`gameModes.${EGameMode[id]}`) || seasonMap.gameMode;
      return {
        id,
        name,
      }
    });
  }

  public get activeGameModesWithAll() {
    return [
      {
        name: this.$t(`gameModes.${EGameMode[EGameMode.UNDEFINED]}`),
        id: EGameMode.UNDEFINED,
      },
      ...this.activeGameModes,
    ];
  }
}
