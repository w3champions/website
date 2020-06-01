import { moduleActionContext } from "..";
import { Clan, ClanMembership, ClanState } from "./types";
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
    selectedMemberShip: {},
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

    async acceptInvite(
      context: ActionContext<ClanState, RootState>
    ) {
      const { rootGetters, state, rootState } = moduleActionContext(context, mod);

      await rootGetters.clanService.acceptInvite(state.selectedMemberShip.clanId, state.selectedMemberShip.battleTag, rootState.oauth.token);
    },

    async rejectInvite(
      context: ActionContext<ClanState, RootState>
    ) {
      const { rootGetters, state, rootState } = moduleActionContext(context, mod);

      await rootGetters.clanService.rejectInvite(state.selectedMemberShip.clanId, state.selectedMemberShip.battleTag, rootState.oauth.token);
    },

    async retrievePlayersClan(
      context: ActionContext<ClanState, RootState>,
    ) {
      const { commit, rootGetters, rootState } = moduleActionContext(context, mod);

      const response = await rootGetters.clanService.retrieveClanForPlayer(
        rootState.player.battleTag
      );

      commit.SET_PLAYERS_CLAN(response);
    },

    async retrievePlayersMembership(
      context: ActionContext<ClanState, RootState>,
    ) {
      const { commit, rootGetters, rootState } = moduleActionContext(context, mod);

      const response = await rootGetters.clanService.retrievePlayerMembership(
        rootState.player.battleTag
      );

      commit.SET_PLAYERS_MEMBERSHIP(response);
    },

    async revokeInvite(
      context: ActionContext<ClanState, RootState>,
      battleTagId: string
    ) {
      const { state, rootGetters, rootState } = moduleActionContext(context, mod);

      await rootGetters.clanService.revokeInvite(
        battleTagId,
        state.playersClan.id,
        rootState.oauth.token
      );
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

      const response = await rootGetters.clanService.invitePlayer(
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
    SET_PLAYERS_MEMBERSHIP(state: ClanState, memberShip: ClanMembership) {
      state.selectedMemberShip = memberShip;
    },
  },
} as const;

export default mod;
