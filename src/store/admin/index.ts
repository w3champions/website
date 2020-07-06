import { moduleActionContext } from "..";
import { RootState } from "../typings";
import { ActionContext } from "vuex";
import { AdminState, BannedPlayer } from './types';
import moment from "moment";
const mod = {
    namespaced: true,
    state: {
        total: 0,
        players: [],
    } as AdminState,
    actions: {
        async loadBannedPlayers(
            context: ActionContext<AdminState, RootState>,
        ) {
            const { commit, rootGetters } = moduleActionContext(context, mod);
            const bannedPlayers = await rootGetters.adminService.getBannedPlayers();
            for (let i = 0; i < bannedPlayers.players.length; i++) {
                const player = bannedPlayers.players[i];
                player.endDate = moment(player.endDate).toISOString().substr(0, 10);
                player.ipBanValue = player.isIpBan.toString();
            }
            commit.SET_BANNED_PLAYERS(bannedPlayers.players);
        },
        async postBan(
            context: ActionContext<AdminState, RootState>,
            bannedPlayer: BannedPlayer
        ) {
            const { state, commit, rootState, rootGetters } = moduleActionContext(context, mod);

            await rootGetters.adminService.postBan(
                bannedPlayer,
                rootState.oauth.token
            );

            let filterPlayer = state.players.find(p => p.battleTag === bannedPlayer.battleTag);

            if (filterPlayer) {
                filterPlayer = bannedPlayer;
            } else {
                commit.ADD_BANNED_PLAYER(bannedPlayer);
            }
        },
        async deleteBan(
            context: ActionContext<AdminState, RootState>,
            bannedPlayer: BannedPlayer
        ) {
            const { state, commit, rootState, rootGetters } = moduleActionContext(context, mod);

            await rootGetters.adminService.deleteBan(
                bannedPlayer,
                rootState.oauth.token
            );

            const bannedPlayers = state.players.filter(p => p.battleTag != bannedPlayer.battleTag);

            commit.SET_BANNED_PLAYERS(bannedPlayers);
        },
    },
    mutations: {
        SET_BANNED_PLAYERS(state: AdminState, bannedPlayers: Array<BannedPlayer>) {
            state.players = bannedPlayers;
        },
        ADD_BANNED_PLAYER(state: AdminState, bannedPlayer: BannedPlayer) {
            state.players.push(bannedPlayer);
        }
    },
} as const;

export default mod;
