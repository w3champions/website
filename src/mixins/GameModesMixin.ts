import Vue from "vue";
import { Component } from "vue-property-decorator";
import { EGameMode, EGameModeType } from "@/store/types";
import { useRankingStore } from "@/store/ranking/store";
import { ActiveGameMode } from "@/store/ranking/types";

const AT_EQUIVALENT: { [key: number]: EGameMode } = {
  [EGameMode.GM_2ON2]: EGameMode.GM_2ON2_AT,
  [EGameMode.GM_4ON4]: EGameMode.GM_4ON4_AT,
  [EGameMode.GM_LEGION_4v4_X20]: EGameMode.GM_LEGION_4v4_X20_AT,
  [EGameMode.GM_DOTA_5ON5]: EGameMode.GM_DOTA_5ON5_AT,
};

@Component
export default class GameModesMixin extends Vue {
  public rankingsStore = useRankingStore();

  public async loadActiveGameModes() {
    await this.rankingsStore.retrieveActiveGameModes();
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
    return this.getGameModes(null, true);
  }

  public get activeMeleeGameModes() {
    return this.getGameModes(EGameModeType.MELEE, false);
  }

  public get activeMeleeGameModesWithAT() {
    return this.getGameModes(EGameModeType.MELEE, true);
  }

  public get AT_modes() {
    return Object.values(AT_EQUIVALENT);
  }

  private getGameModes(type: EGameModeType | null, withAt: boolean) {
    return this.rankingsStore.activeModes
      .reduce((result: ActiveGameMode[], mode: ActiveGameMode) => {
        result.push(mode);
        if (withAt && AT_EQUIVALENT[mode.id]) {
          result.push({
            ...mode,
            id: AT_EQUIVALENT[mode.id],
            name: mode.name + " AT",
          });
        }
        return result;
      }, [])
      .filter((mode) => type === null || mode.type === type)
      .map((mode) => {
        const id = mode.id;
        const name = this.$t(`gameModes.${EGameMode[id]}`) || mode.name;
        return {
          id,
          name,
        };
      });
  }
}
