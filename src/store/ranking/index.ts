import { moduleActionContext } from '..';
import { RankingState, Ranking } from './types';
import { DataTableOptions } from '../typings';

const mod = {
    namespaced: true,
    state: {
        page: 0,
        totalRanks: 0,
        working: false,
        rankings: [],
        topFive: [],
        searchRanks: [],
    } as RankingState,
    actions: {
        async retrieveRankings(context: any, options?: DataTableOptions) {
            const { commit, rootGetters, state } = moduleActionContext(context, mod);
            
            if (options && options.page != null) {
                commit.SET_PAGE(options.page - 1);
            }

            const response = await rootGetters.rankingService.retrieveRankings(state.page);

            commit.SET_TOTAL_RANKS(response.total)
            commit.SET_RANKINGS(response.items);
        },
        async getTopFive(context: any) {
            const { commit, rootGetters, state } = moduleActionContext(context, mod);

            const rankings = await rootGetters.rankingService.retrieveRankings(0);
            commit.SET_TOP_FIVE(rankings.items.slice(0, 5));
        },
        async search(context: any, searchText: string) {
            const { commit, rootGetters, state } = moduleActionContext(context, mod);

            const rankings = await rootGetters.rankingService.searchRankings(searchText);
            commit.SET_SEARCH_RANKINGS(rankings);
        }
    },
    mutations: {
        SET_RANKINGS(state: RankingState, rankings: Ranking[]) {
            state.rankings = rankings;
        },
        SET_PAGE(state: RankingState, page: number) {
            state.page = page;
        },
        SET_TOTAL_RANKS(state: RankingState, totalRanks: number) {
            state.totalRanks = totalRanks;
        },
        SET_TOP_FIVE(state: RankingState, rankings: Ranking[]) {
            state.topFive = rankings;
        },
        SET_SEARCH_RANKINGS(state: RankingState, rankings: Ranking[]) {
            state.searchRanks = rankings;
        }
    }
} as const;

export default mod;