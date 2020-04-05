import { Moment } from 'moment';

export type OveralStatisticState = {
  games: GameDay[];
  loadingGamesPerDayStats: boolean;
};

export type GameDay = {
  date: Moment,
  gamesPlayed: number,
  id: string
}
