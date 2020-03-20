import { Match } from '@/store/typings';

export default class MatchService {
    private pageSize: number;

    constructor(pageSize: number) {
        this.pageSize = pageSize;
    }

    public async retrieveRankings(page: number): Promise<{ total: number; items: Match[] }> {
        const offset = page * this.pageSize;
        const url = `http://w3champions.com:25059/match?limit=${this.pageSize}&offset=${offset}`;

        const response = await fetch(url);
        return await response.json();
    }
}