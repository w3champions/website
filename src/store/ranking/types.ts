export type RankingState = {
  gateway: Gateways;
  working: boolean;
  page: number;
  totalRanks: number;
  rankings: Ranking[];
  topFive: Ranking[];
  searchRanks: Ranking[];
};

export type Gateways = 'Europe' | 'Americas';

export type Ranking = {
  rank: number;
  battleTag: string;
  wins: number;
  losses: number;
  level: number;
  levelProgress: number;
};
