import { Moment } from "moment";
import { EGameMode, EPick, ERaceEnum } from "@/store/typings";

export type OveralStatisticState = {
  gamesPerDay: GameDay[];
  loadingGamesPerDayStats: boolean;
  playersPerDay: GameDay[];
  loadingPlayersPerDayStats: boolean;
  statsPerMapAndRace: StatsPerWinrate[];
  gameLengths: GameLength[];
  popularGameHours: PopularGameHour[];
  playedHeroes: PlayedHeroByMode[];
  heroWinrate: WinLoss;
  loadingMapAndRaceStats: boolean;
  mmrDistribution: MmrDistribution;
  heroPicks: HeroPick[];
};

export interface PlayedHeroPick {
  pick: EPick;
  stats: PlayedHero[];
}

export interface PlayedHeroByMode {
  gameMode: EGameMode;
  orderedPicks: PlayedHeroPick[];
}

export interface PlayedHero {
  icon: string;
  count: number;
}

export type GameDay = {
  date: Moment;
  gamesPlayed: number;
  id: string;
};

export type MmrCount = {
  mmr: number;
  count: number;
};

export interface HeroPick {
  index: number,
  name: string,
  heroId: string,
  disabled: boolean
}

export type MmrDistribution = {
  top2PercentIndex: number;
  top5PercentIndex: number;
  top10PercentIndex: number;
  top25ercentIndex: number;
  top50PercentIndex: number;
  distributedMmrs: MmrCount[];
};

export type PlayersPerDay = {
  date: Moment;
  distinctPlayers: number;
};

export interface WinLoss {
  wins: number;
  losses: number;
  winrate: number;
  games: number;
}

export interface RaceWinLoss extends WinLoss {
  race: ERaceEnum;
}

export type Ratio = {
  race: ERaceEnum;
  winLosses: RaceWinLoss[];
};

export type StatsPerMapAndRace = {
  mapName: string;
  ratio: Ratio[];
};

export type StatsPerWinrate = {
  mmrRange: number;
  statsPerModes: StatsPerMapAndRace[];
};

export interface Length {
  passedTimeInSeconds: number;
  games: number;
}

export interface SpecificGameHour {
  passedTimeInSeconds: number;
  games: number;
  minutes: number;
  hours: number;
}

export interface GameLength {
  gameMode: EGameMode;
  lengths: Length[];
}

export interface PopularGameHour {
  gameMode: EGameMode;
  playTimePerHour: SpecificGameHour[];
}
