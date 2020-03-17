import { moduleActionContext } from '..';
import { RankingState, Ranking } from './types';
import { DataTableOptions } from '../typings';

const mod = {
    namespaced: true,
    state: {
        page: 0,
        working: false,
        rankings: [],
    } as RankingState,
    actions: {
        async retrieveRankings(context: any, options?: DataTableOptions) {
            const { commit, rootGetters, state } = moduleActionContext(context, mod);
            
            if (options && options.page != null) {
                commit.SET_PAGE(options.page - 1);
            }

            const rankings = await rootGetters.rankingService.retrieveRankings(state.page);
            commit.SET_RANKINGS(rankings);
        },
    },
    mutations: {
        SET_RANKINGS(state: RankingState, rankings: Ranking[]) {
            state.rankings = rankings;
        },
        SET_PAGE(state: RankingState, page: number) {
            state.page = page;
        },
    }
} as const;

export default mod;