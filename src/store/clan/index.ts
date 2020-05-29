import { moduleActionContext } from "..";
import { Clan, ClanState } from "./types";
import { RootState } from "../typings";
import { ActionContext } from "vuex";
import { PlayerProfile } from "@/store/player/types";

const mod = {
  namespaced: true,
  state: {
    selectedClan: {},
    playersClan: {},
    clanValidationError: "",
    loading: true,
    searchPlayers: [] as PlayerProfile[],
  } as ClanState,
  actions: {
    async createClan(
      context: ActionContext<ClanState, RootState>,
      clanName: string
    ) {
      const { commit, rootGetters, rootState } = moduleActionContext(
        context,
        mod
      );

      commit.SET_LOADING(true);

      const response = await rootGetters.clanService.createClan(
        clanName,
        rootState.oauth.token
      );

      commit.SET_LOADING(true);
      commit.SET_CLAN_ERROR(response);
    },

    async retrieveClan(
      context: ActionContext<ClanState, RootState>,
      clanId: string
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const response = await rootGetters.clanService.retrieveClan(clanId);

      commit.SET_SELECTED_CLAN(response);
    },

    async retrievePlayersClan(
      context: ActionContext<ClanState, RootState>,
      battleTagId: string
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const response = await rootGetters.clanService.retrieveClanForPlayer(
        battleTagId
      );

      commit.SET_PLAYERS_CLAN(response);
    },

    async searchPlayers(
      context: ActionContext<ClanState, RootState>,
      search: string
    ) {
      const { commit, rootGetters } = moduleActionContext(context, mod);

      const response = await rootGetters.profileService.searchPlayer(search);

      commit.SET_PLAYERS_SEARCH(response);
    },

    async invitePlayer(
      context: ActionContext<ClanState, RootState>,
      battleTag: string
    ) {
      const { commit, state, rootGetters, rootState } = moduleActionContext(
        context,
        mod
      );

      const response = await rootGetters.profileService.invitePlayer(
        battleTag,
        state.playersClan.id,
        rootState.oauth.token
      );

      commit.SET_CLAN_ERROR(response);
    },
  },
  mutations: {
    SET_SELECTED_CLAN(state: ClanState, clan: Clan) {
      state.selectedClan = clan;
    },
    SET_PLAYERS_CLAN(state: ClanState, clan: Clan) {
      state.playersClan = clan;
    },
    SET_CLAN_ERROR(state: ClanState, error: string) {
      state.clanValidationError = error;
    },
    SET_LOADING(state: ClanState, loading: boolean) {
      state.loading = loading;
    },
    SET_PLAYERS_SEARCH(state: ClanState, players: PlayerProfile[]) {
      state.searchPlayers = players;
    },
  },
} as const;

export default mod;
