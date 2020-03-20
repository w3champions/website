import { Match } from '@/store/typings';
import { API_URL } from '@/main';

export default class MatchService {
    private pageSize: number;

    constructor(pageSize: number) {
        this.pageSize = pageSize;
    }

    public async retrieveMatches(page: number): Promise<{ total: number; items: Match[] }> {
        const offset = page * this.pageSize;
        const url = `${API_URL}/match?limit=${this.pageSize}&offset=${offset}`;

        const response = await fetch(url);
        return await response.json();
    }

    public async retrievePlayerMatches(page: number, battleTag: string): Promise<{total: number; items: Match[]}> {
        const offset = page * 15;
        const url = `${API_URL}/player/${encodeURIComponent(battleTag)}/match?limit=15&offset=${offset}`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        });
        return await response.json();
    }
}