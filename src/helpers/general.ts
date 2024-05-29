import { Race } from "@/store/player/types";
import { ERaceEnum } from "@/store/types";
import { useI18n } from "vue-i18n-bridge";

// got it from here: https://www.petermorlion.com/iterating-a-typescript-enum/
export const enumKeys = <
  O extends Record<string, unknown>,
  K extends keyof O = keyof O
>(
  obj: O
): K[] => {
  return Object.keys(obj).filter((k) => Number.isNaN(+k)) as K[];
};

export const races = (): Race[] => {
  return [
    { raceId: ERaceEnum.HUMAN, raceName: useI18n().t(`races.${ERaceEnum[ERaceEnum.HUMAN]}`) },
    { raceId: ERaceEnum.ORC, raceName: useI18n().t(`races.${ERaceEnum[ERaceEnum.ORC]}`) },
    { raceId: ERaceEnum.NIGHT_ELF, raceName: useI18n().t(`races.${ERaceEnum[ERaceEnum.NIGHT_ELF]}`) },
    { raceId: ERaceEnum.UNDEAD, raceName: useI18n().t(`races.${ERaceEnum[ERaceEnum.UNDEAD]}`) },
    { raceId: ERaceEnum.RANDOM, raceName: useI18n().t(`races.${ERaceEnum[ERaceEnum.RANDOM]}`) },
  ];
};

export const racesWithTotal: Race[] = [
  { raceId: ERaceEnum.HUMAN, raceName: ERaceEnum[ERaceEnum.HUMAN] },
  { raceId: ERaceEnum.ORC, raceName: ERaceEnum[ERaceEnum.ORC] },
  { raceId: ERaceEnum.NIGHT_ELF, raceName: ERaceEnum[ERaceEnum.NIGHT_ELF] },
  { raceId: ERaceEnum.UNDEAD, raceName: ERaceEnum[ERaceEnum.UNDEAD] },
  { raceId: ERaceEnum.RANDOM, raceName: ERaceEnum[ERaceEnum.RANDOM] },
  { raceId: ERaceEnum.TOTAL, raceName: ERaceEnum[ERaceEnum.TOTAL] },
];

export const authorizedFetch = async (method: string, url: RequestInfo | URL, token: string, body?: BodyInit | null): Promise<Response> => {
    return await fetch(url, {
      method: method,
      body: body,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
    });
  };
