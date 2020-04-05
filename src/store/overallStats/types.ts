import { Moment } from 'moment';
import {EGameMode, ERaceEnum} from "@/store/typings";

export type OveralStatisticState = {
  gamesPerDay: GameDay[];
  loadingGamesPerDayStats: boolean;
  playersPerDay: GameDay[];
  loadingPlayersPerDayStats: boolean;
  statsPerMapAndRace: StatsPerMapAndRace;
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

export type RaceWinRatio = {
  race: ERaceEnum;
  winLosses: WinLoss[];
}

export type RaceVersusRaceRatio = {
  raceWinRatio: RaceWinRatio[];
  id: string;
}

export type WinLossesOnMap = {
  map: string;
  winLosses: WinLoss[];
}

export type RaceWinsOnMap = {
  race: ERaceEnum;
  winLossesOnMap: WinLossesOnMap[];
}

export type RaceOnMapVersusRaceRatio = {
  raceWinsOnMap: RaceWinsOnMap[];
  id: string;
}

export type StatsPerMode = {
  gameMode: EGameMode;
  totalGames: number;
  raceVersusRaceRatio: RaceVersusRaceRatio;
  raceOnMapVersusRaceRatio: RaceOnMapVersusRaceRatio;
}

export type StatsPerMapAndRace = {
  statsPerModes: StatsPerMode[];
}
