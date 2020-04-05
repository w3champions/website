import { Moment } from 'moment';

export type OveralStatisticState = {
  gamesPerDay: GameDay[];
  loadingGamesPerDayStats: boolean;
  playersPerDay: GameDay[]
  loadingPlayersPerDayStats: boolean
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
