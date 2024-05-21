import { Race } from "@/store/player/types";
import { ERaceEnum } from "@/store/types";
import { i18n } from "@/main";
import { TranslateResult } from "vue-i18n";

// got it from here: https://www.petermorlion.com/iterating-a-typescript-enum/
export const enumKeys = <
  O extends Record<string, unknown>,
  K extends keyof O = keyof O
>(
  obj: O
): K[] => {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
};

export const races: Race[] = [
  { raceId: ERaceEnum.HUMAN, raceName: ERaceEnum[ERaceEnum.HUMAN] },
  { raceId: ERaceEnum.ORC, raceName: ERaceEnum[ERaceEnum.ORC] },
  { raceId: ERaceEnum.NIGHT_ELF, raceName: ERaceEnum[ERaceEnum.NIGHT_ELF] },
  { raceId: ERaceEnum.UNDEAD, raceName: ERaceEnum[ERaceEnum.UNDEAD] },
  { raceId: ERaceEnum.RANDOM, raceName: ERaceEnum[ERaceEnum.RANDOM] },
];

export const racesWithTotal: Race[] = [
  { raceId: ERaceEnum.HUMAN, raceName: ERaceEnum[ERaceEnum.HUMAN] },
  { raceId: ERaceEnum.ORC, raceName: ERaceEnum[ERaceEnum.ORC] },
  { raceId: ERaceEnum.NIGHT_ELF, raceName: ERaceEnum[ERaceEnum.NIGHT_ELF] },
  { raceId: ERaceEnum.UNDEAD, raceName: ERaceEnum[ERaceEnum.UNDEAD] },
  { raceId: ERaceEnum.RANDOM, raceName: ERaceEnum[ERaceEnum.RANDOM] },
  { raceId: ERaceEnum.TOTAL, raceName: ERaceEnum[ERaceEnum.TOTAL] },
];

export const translateRaceName = (race: Race | number): TranslateResult => {
  return typeof race === "number" ? i18n.t(`races.${ERaceEnum[race]}`) : i18n.t(`races.${ERaceEnum[race.raceId]}`);
};
