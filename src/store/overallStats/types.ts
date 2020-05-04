import { Moment } from 'moment';
import {EGameMode, ERaceEnum} from "@/store/typings";

export interface PlayedHero {
  icon: string;
  count: number;
}

export type OveralStatisticState = {
  gamesPerDay: GameDay[];
  loadingGamesPerDayStats: boolean;
  playersPerDay: GameDay[];
  loadingPlayersPerDayStats: boolean;
  statsPerMapAndRace: StatsPerMapAndRace[];
  gameLengths: GameLength[];
  popularGameHours: PopularGameHour[];
  playedHeroes: PlayedHero[];
  selectedGameLength: EGameMode;
  selectedPopularHour: EGameMode;
  loadingMapAndRaceStats: boolean;
};

export type GameDay = {
  date: Moment,
  gamesPlayed: number,
  id: string
}

export type PlayersPerDay = {
  date: Moment,
  distinctPlayers: number
}


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
}

export type StatsPerMapAndRace = {
  mapName: string;
  ratio: Ratio[];
}

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
