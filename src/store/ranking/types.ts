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
  rank: number;
  battleTag: string;
  wins: number;
  losses: number;
  level: number;
  levelProgress: number;
};

export enum Gateways {
  America = 10,
  Europe = 20,
  Asia = 30
}
