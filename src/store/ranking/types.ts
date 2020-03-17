export type RankingState = {
    working: boolean;
    page: number;
    rankings: Ranking[];
}

export type Ranking = {
    rank: number;
    name: string;
    wins: number;
    losses: number;
    level: number;
    levelProgress: number;
}