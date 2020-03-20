export type RankingState = {
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
