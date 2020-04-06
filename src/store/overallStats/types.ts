import { Moment } from 'moment';
import {EGameMode, ERaceEnum} from "@/store/typings";

export type OveralStatisticState = {
  gamesPerDay: GameDay[];
  loadingGamesPerDayStats: boolean;
  playersPerDay: GameDay[];
  loadingPlayersPerDayStats: boolean;
  statsPerMapAndRace: StatsPerMapAndRace[];
  loadingMapAndRaceStats: boolean
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

export type WinLoss = {
  race: ERaceEnum;
  wins: number;
  losses: number;
  winrate: number;
}

export type Ratio = {
  race: ERaceEnum;
  winLosses: WinLoss[];
}

export type StatsPerMapAndRace = {
  mapName: string;
  ratio: Ratio[];
}
