export type RankingState = {
  gateway: Gateways;
  league: number;
  working: boolean;
  page: number;
  totalRanks: number;
  ladders: Ladder[];
  rankings: Ranking[];
  topFive: Ranking[];
  searchRanks: Ranking[];
};

export type Ladder = {
  gateway: Gateways;
  leagues: League[];
};

export type League = {
  id: number,
  name: string,
  order: number,
  maxParticipantCount: number
}

export type Ranking = {
  gateway: number;
  league: number;
  rankNumber: number;
  rankingPoints: number;
  player: PlayerOverview;
};

export type PlayerOverview = {
  id: string;
  battleTag: string;
  name: string;
  totalLosses: number;
  totalWins: number;
  games: number;
  winrate: number;
  mmr: number;
  gateWay: number;
}


export enum Gateways {
  America = 10,
  Europe = 20,
  Asia = 30
}
