import { moduleActionContext } from "..";
import { MatchState } from './types';
import { Match, DataTableOptions } from '../typings';

const mod = {
    namespaced: true,
    state: {
        page: 0,
        totalMatches: 0,
        matches: [] as Match[],
    } as MatchState,
    actions: {
        async loadMatches(context: any, options?: DataTableOptions) {
            const { commit, rootGetters, state } = moduleActionContext(context, mod);

            if (options && options.page != null) {
                commit.SET_PAGE(options.page - 1);
            }

            const response = await rootGetters.matchService.retrieveRankings(state.page);

            commit.SET_TOTAL_MATCHES(response.total);
            commit.SET_MATCHES(response.items);
        }
    },
    mutations: {
        SET_PAGE(state: MatchState, page: number) {
            state.page = page;
        },
        SET_TOTAL_MATCHES(state: MatchState, totalMatches: number) {
            state.totalMatches = totalMatches;
        },
        SET_MATCHES(state: MatchState, matches: Match[]) {
            state.matches = matches;
        },
    }
} as const;

export default mod;