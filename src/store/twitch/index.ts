import { moduleActionContext } from "..";
import { RootState } from "../typings";
import { ActionContext } from "vuex";
import { TwitchState, TwitchStreamResponse } from './types';

const mod = {
    namespaced: true,
    state: {
        twitchStreamResponse: {} as TwitchStreamResponse,
    } as TwitchState,
    actions: {
        async getStreamStatus(
            context: ActionContext<TwitchState, RootState>,
            twitchNames: string[]
        ) {
            const { commit, rootGetters, rootState } = moduleActionContext(
                context,
                mod
            );

            let token = rootState.oauth.twitch_token;

            token = await rootGetters.oauthService.authorizeWithTwitch();

            const response = await rootGetters.twitchService.getStreamStatus(
                token, twitchNames
            );

            commit.SET_TWITCH_STREAM_RESPONSE(response);
        },
    },
    mutations: {
        SET_TWITCH_STREAM_RESPONSE(
            state: TwitchState,
            response: TwitchStreamResponse
        ) {
            state.twitchStreamResponse = response;
        },
    },
} as const;

export default mod;
