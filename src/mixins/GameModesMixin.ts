import { EGameMode, EGameModeType } from "@/store/types";
import { useRankingStore } from "@/store/ranking/store";
import { ActiveGameMode } from "@/store/ranking/types";
import { useI18n } from "vue-i18n";
import { LocaleMessage } from "vue-i18n";

export interface IGameModeBrief {
  name: LocaleMessage;
  id: EGameMode;
}

const AT_EQUIVALENT: { [key: number]: EGameMode } = {
  [EGameMode.GM_2ON2]: EGameMode.GM_2ON2_AT,
  [EGameMode.GM_4ON4]: EGameMode.GM_4ON4_AT,
  [EGameMode.GM_LEGION_4v4_X20]: EGameMode.GM_LEGION_4v4_X20_AT,
  [EGameMode.GM_DOTA_5ON5]: EGameMode.GM_DOTA_5ON5_AT,
};

export async function loadActiveGameModes() {
  const rankingsStore = useRankingStore();
  await rankingsStore.retrieveActiveGameModes();
}

export function activeGameModes(): IGameModeBrief[] {
  return getGameModes(null, false);
}

export function activeGameModesWithAll(): IGameModeBrief[] {
  const { t } = useI18n();
  return [
    {
      name: t(`gameModes.${EGameMode[EGameMode.UNDEFINED]}`),
      id: EGameMode.UNDEFINED,
    },
    ...activeGameModes(),
  ];
}

export function activeGameModesWithAT(): IGameModeBrief[] {
  return getGameModes(null, true);
}

export function activeMeleeGameModes(): IGameModeBrief[] {
  return getGameModes(EGameModeType.MELEE, false);
}

export function activeMeleeGameModesWithAT(): IGameModeBrief[] {
  return getGameModes(EGameModeType.MELEE, true);
}

export function AT_modes(): EGameMode[] {
  return Object.values(AT_EQUIVALENT);
}

function getGameModes(type: EGameModeType | null, withAt: boolean): IGameModeBrief[] {
  const { t } = useI18n();
  const rankingsStore = useRankingStore();
  return rankingsStore.activeModes
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
      const name = t(`gameModes.${EGameMode[id]}`) || mode.name;
      return {
        id,
        name,
      };
    });
}
