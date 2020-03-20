import { Match } from '@/store/typings';
import { API_URL } from '@/main';

export default class MatchService {
    private pageSize: number;
    private smallPageSize: number;

    constructor(pageSize: number, smallPageSize: number) {
        this.pageSize = pageSize;
        this.smallPageSize = smallPageSize
    }

    public async retrieveRankings(page: number): Promise<{ total: number; items: Match[] }> {
        const offset = page * this.pageSize;
        const url = `${API_URL}/match?limit=${this.pageSize}&offset=${offset}`;

        const response = await fetch(url);
        return await response.json();
    }

    public async retrievePlayerMatches(page: number, battleTag: string): Promise<{total: number; items: Match[]}> {
        const offset = page * this.smallPageSize;
        const url = `${API_URL}/player/${encodeURIComponent(battleTag)}/match?limit=${this.smallPageSize}&offset=${offset}`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        });
        return await response.json();
    }
}