import { Ranking } from '@/store/ranking/types';

export default class RankingService {
    private pageSize: number;

    constructor(pageSize: number) {
        this.pageSize = pageSize;
    }

    public async retrieveRankings(page: number): Promise<Ranking[]> {
        const offset = page * this.pageSize;
        const url = `rank?limit=${this.pageSize}&offset=${offset}`;

        /*
        // uncomment this to retrieve real data
        const response = await fetch(url);
        return await response.json(); */

        return this.createFakeData(page);
    }

    private createFakeData(page: number) {
        const data: Ranking[] = [];

        for (let i = page*this.pageSize; i < (page+1)*this.pageSize; i++) {
            data.push({
                rank: i + 1,
                name: `Player ${i + 1}`,
                wins: i,
                losses: i,
                level: Math.floor(Math.random() * 50),
                levelProgress: Math.random(),
            });
        }

        return data;
    }
}