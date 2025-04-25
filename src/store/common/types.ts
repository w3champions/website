import { HeroFilter } from "../heroes";

export enum EChatScope {
  ALL = 0,
  ALLIES = 1,
  OBSERVERS = 2,
  PLAYER = 3,
}

export type MapInfo = {
  readonly mapName: string;
  readonly map: string;
};

export type CommonState = {
  heroFilters: HeroFilter[];
};
