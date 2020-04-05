import VueMoment from "vue-moment";

export type OveralStatisticState = {
  games: GameDay[];
  loadingStats: boolean;
};

export type GameDay = {
  date: VueMoment,
  gamesPlayed: number,
  id: string
}
