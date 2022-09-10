import Vue from "vue";
import { Component } from "vue-property-decorator";
import { EGameMode, EGameModeType } from "@/store/typings";
import _ from "lodash";
import { SeasonMap } from "@/store/admin/maps/types";

const AT_EQUIVALENT: { [key: number]: EGameMode } = {
  [EGameMode.GM_2ON2]: EGameMode.GM_2ON2_AT,
  [EGameMode.GM_4ON4]: EGameMode.GM_4ON4_AT,
  [EGameMode.GM_LEGION_4v4_X20]: EGameMode.GM_LEGION_4v4_X20_AT,
}

@Component
export default class GameModesMixin extends Vue {
  public async loadActiveGameModes() {
    await this.$store.direct.dispatch.admin.mapsManagement.loadMapsForCurrentSeason();
  }

  public get activeGameModes() {
    return this.getGameModes(null, false);
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

  public get activeGameModesWithAT() {
    return this.getGameModes(null, true)
  }

  public get activeMeleeGameModes() {
    return this.getGameModes(EGameModeType.MELEE, false);
  }

  public get activeMeleeGameModesWithAT() {
    return this.getGameModes(EGameModeType.MELEE, true);
  }

  private getGameModes(type: EGameModeType | null, withAt: boolean) {
    return _
      .chain(this.$store.direct.state.admin.mapsManagement.seasonMaps)
      .reduce((result: SeasonMap[], seasonMap: SeasonMap) => {
        result.push(seasonMap);
        if (withAt && AT_EQUIVALENT[seasonMap.id]) {
          result.push({
            ...seasonMap,
            id: AT_EQUIVALENT[seasonMap.id],
            gameMode: seasonMap.gameMode + ' AT',
          });
        }
        return result;
      }, [])
      .filter(seasonMap => type === null || seasonMap.type === type)
      .map(seasonMap => {
        const id = seasonMap.id;
        const name = this.$t(`gameModes.${EGameMode[id]}`) || seasonMap.gameMode;
        return {
          id,
          name,
        }
      })
      .value();
  }
}
