export type RankingState = {
  gateway: Gateways;
  working: boolean;
  page: number;
  totalRanks: number;
  rankings: Ranking[];
  topFive: Ranking[];
  searchRanks: Ranking[];
};

export type Ranking = {
  id: string;
  battleTag: string;
  name: string;
  totalLosses: number;
  totalWins: number;
  games: number;
  winrate: number;
  mmr: number;
  gateWay: number;
};

export enum Gateways {
  America = 10,
  Europe = 20,
  Asia = 30
}
